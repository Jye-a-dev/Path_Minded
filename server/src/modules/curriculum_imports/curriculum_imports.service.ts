import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  MessageEvent,
} from '@nestjs/common';
import { Pool } from 'pg';
import { Subject, Observable } from 'rxjs';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  CurriculumImportsPaginationResponse,
  CurriculumImportEntity,
  CurriculumImportResponse,
} from './interfaces/curriculum_imports.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryCurriculumImportsDto } from './dto/query-curriculum-imports.dto';
import { CourseTypeMappingsService } from '../course_type_mappings/course_type_mappings.service';
import {
  ensureDbSchema,
  parseCurriculumWithPipeline,
  saveParseWarnings,
  insertCurriculumCourses,
  ParsedCourseItem,
  parsePrerequisites,
} from './curriculum_imports.helper';

interface DbCourseRecord {
  id: string;
  program_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  theory_hours: number | null;
  practice_hours: number | null;
  knowledge_block: string;
}

interface ConflictDetails {
  courseCode: string;
  dbRecord: DbCourseRecord;
  excelRecord: ParsedCourseItem;
  diffFields: string[];
}

@Injectable()
export class CurriculumImportsService implements OnModuleInit {
  private progressSubjects = new Map<string, Subject<MessageEvent>>();

  constructor(
    @Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool,
    private readonly courseTypeMappingsService: CourseTypeMappingsService,
  ) {}

  async onModuleInit() {
    const client = await this.pool.connect();
    try {
      // Add parsed_json column if not exists
      await client.query(
        `ALTER TABLE curriculum_imports ADD COLUMN IF NOT EXISTS parsed_json JSONB;`,
      );

      // Skip migration if course_prerequisites already has data (one-off migration)
      const existingCount = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM course_prerequisites`,
      );
      if (Number(existingCount.rows[0]?.count ?? 0) > 0) {
        return;
      }

      console.log(
        'Running automated one-off prerequisite parsing and migration...',
      );

      const coursesResult = await client.query<{
        program_id: string;
        course_code: string;
        prerequisite: string | null;
        corequisite: string | null;
      }>(
        `SELECT program_id, course_code, prerequisite, corequisite 
         FROM curriculum_courses 
         WHERE (prerequisite IS NOT NULL AND prerequisite <> '')
            OR (corequisite IS NOT NULL AND corequisite <> '')`,
      );

      const courses = coursesResult.rows;
      if (courses.length === 0) return;

      console.log(
        `Found ${courses.length} courses with prerequisites/corequisites. Populating course_prerequisites table...`,
      );

      // Build all rows to insert
      const programIds: string[] = [];
      const courseCodes: string[] = [];
      const prereqCodes: string[] = [];
      const prereqTypes: string[] = [];

      for (const course of courses) {
        if (course.prerequisite) {
          const prereqs = parsePrerequisites(course.prerequisite);
          for (const prereqCode of prereqs) {
            if (prereqCode === course.course_code) continue;
            programIds.push(course.program_id);
            courseCodes.push(course.course_code);
            prereqCodes.push(prereqCode);
            prereqTypes.push('REQUIRED');
          }
        }
        if (course.corequisite) {
          const coreqs = parsePrerequisites(course.corequisite);
          for (const coreqCode of coreqs) {
            if (coreqCode === course.course_code) continue;
            programIds.push(course.program_id);
            courseCodes.push(course.course_code);
            prereqCodes.push(coreqCode);
            prereqTypes.push('PREVIOUS');
          }
        }
      }

      if (programIds.length > 0) {
        // Single batch INSERT using unnest — avoids N round-trips
        await client.query(
          `INSERT INTO course_prerequisites (program_id, course_code, prerequisite_course_code, prerequisite_type)
           SELECT UNNEST($1::uuid[]), UNNEST($2::text[]), UNNEST($3::text[]), UNNEST($4::text[])
           ON CONFLICT (program_id, course_code, prerequisite_course_code) 
           DO UPDATE SET prerequisite_type = EXCLUDED.prerequisite_type`,
          [programIds, courseCodes, prereqCodes, prereqTypes],
        );
      }

      console.log('Automated prerequisite migration completed.');
    } catch (err) {
      console.error('Failed to run prerequisite migration:', err);
    } finally {
      client.release();
    }
  }

  getProgressStream(id: string): Observable<MessageEvent> {
    let subject = this.progressSubjects.get(id);
    if (!subject) {
      subject = new Subject<MessageEvent>();
      this.progressSubjects.set(id, subject);
    }
    return subject.asObservable();
  }

  async create(
    payload: Record<string, unknown>,
    file?: Express.Multer.File,
  ): Promise<any> {
    const programId = payload.programId as string;
    const advisorId = payload.advisorId as string;
    const fileName = file ? file.originalname : 'Pasted Text';
    const fileBuffer = file ? file.buffer : null;

    const insertResult = await this.pool.query<CurriculumImportEntity>(
      `INSERT INTO curriculum_imports (advisor_id, program_id, file_name, file_path, file_data, import_status) 
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [advisorId || null, programId || null, fileName, null, fileBuffer],
    );
    const importRecord = insertResult.rows[0];

    // Initialize the Subject for SSE
    const subject = new Subject<MessageEvent>();
    this.progressSubjects.set(importRecord.id, subject);

    // Run background parser
    const textContent = (payload.textContent as string) || null;
    const mimetype = file ? file.mimetype : 'text/plain';
    void this.processImportInBackground(
      importRecord.id,
      programId,
      fileBuffer
        ? { buffer: fileBuffer, originalname: fileName, mimetype }
        : null,
      textContent,
      0,
    );

    return {
      importSession: importRecord,
    };
  }

  async reparse(id: string, payload: Record<string, unknown>): Promise<any> {
    const sheetIndex =
      payload.sheetIndex !== undefined ? Number(payload.sheetIndex) : 0;

    const importResult = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (importResult.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    const importRecord = importResult.rows[0];
    if (importRecord.import_status !== 'PENDING') {
      throw new BadRequestException('Import is not in PENDING state');
    }

    const fileBuffer = importRecord.file_data;
    if (!fileBuffer) {
      throw new BadRequestException(
        'No Excel file data found for this session in the database',
      );
    }

    // Reset the Subject for SSE progress tracking
    const subject = new Subject<MessageEvent>();
    this.progressSubjects.set(id, subject);

    // Run background parser
    void this.processImportInBackground(
      id,
      importRecord.program_id,
      {
        buffer: fileBuffer,
        originalname: importRecord.file_name,
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      null,
      sheetIndex,
    );

    return {
      importSession: importRecord,
    };
  }

  private async processImportInBackground(
    id: string,
    programId: string | null,
    file: {
      buffer: Buffer | null;
      originalname: string;
      mimetype: string;
    } | null,
    textContent: string | null,
    sheetIndex = 0,
  ) {
    // Artificial delay to allow client to open SSE connection
    await new Promise((resolve) => setTimeout(resolve, 500));

    const subject = this.progressSubjects.get(id);
    const emit = (data: Record<string, unknown>) => {
      if (subject) {
        subject.next({ data: JSON.stringify(data) });
      }
    };

    emit({ type: 'info', message: 'Khởi động cơ chế phân tích cú pháp...' });

    const courseTypeMappingConfig =
      (await this.courseTypeMappingsService.getMappingConfig()) as Record<
        string,
        unknown
      >;

    try {
      emit({
        type: 'info',
        message: 'Đang chuyển tệp đến bộ bóc tách chuyên dụng...',
      });

      const parsed = await parseCurriculumWithPipeline(
        this.pool,
        courseTypeMappingConfig,
        {
          file:
            file && file.buffer
              ? {
                  buffer: file.buffer,
                  originalname: file.originalname,
                  mimetype: file.mimetype,
                }
              : null,
          textContent,
          sheetIndex,
        },
      );

      // Check header detection failure
      if (parsed.headersDetected === false) {
        emit({
          type: 'unresolved_headers',
          message:
            'Không tìm thấy cấu trúc tiêu đề cột chuẩn. Cần khớp cột thủ công.',
          rawHeaders: parsed.rawHeaders,
          potentialHeaderRow: parsed.potentialHeaderRow,
          sheets: parsed.sheets,
          activeSheetIndex: parsed.activeSheetIndex,
        });

        // Save status in DB
        await this.pool.query(
          `UPDATE curriculum_imports SET parsed_json = $1 WHERE id = $2`,
          [JSON.stringify(parsed), id],
        );

        if (subject) {
          subject.complete();
          this.progressSubjects.delete(id);
        }
        return;
      }

      emit({
        type: 'info',
        message: `Đã phát hiện tiêu đề cột thành công. Bắt đầu đối soát dữ liệu với CSDL (Tổng số: ${parsed.preview.length} học phần)...`,
      });

      const conflicts: any[] = [];
      const courses = parsed.preview;

      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const courseCode = course.courseCode || course.course_code;

        if (!courseCode) continue;

        // Query database to check for conflicts using the exact composite PK
        const courseType =
          course.courseType || course.course_type || 'REQUIRED';
        const dbResult = await this.pool.query<DbCourseRecord>(
          `SELECT * FROM curriculum_courses WHERE program_id = $1 AND course_code = $2 AND course_type = $3::course_type`,
          [programId, courseCode, courseType],
        );

        let hasConflict = false;
        let conflictDetails: ConflictDetails | null = null;

        if (dbResult.rows.length > 0) {
          const dbRecord = dbResult.rows[0];
          const diffFields: string[] = [];

          // Compare fields
          if (
            course.courseName &&
            dbRecord.course_name &&
            course.courseName.trim().toLowerCase() !==
              dbRecord.course_name.trim().toLowerCase()
          ) {
            diffFields.push('courseName');
          }
          if (
            course.credits != null &&
            dbRecord.credits != null &&
            Number(course.credits) !== Number(dbRecord.credits)
          ) {
            diffFields.push('credits');
          }
          if (
            course.theoryHours != null &&
            dbRecord.theory_hours != null &&
            Number(course.theoryHours) !== Number(dbRecord.theory_hours)
          ) {
            diffFields.push('theoryHours');
          }
          if (
            course.practiceHours != null &&
            dbRecord.practice_hours != null &&
            Number(course.practiceHours) !== Number(dbRecord.practice_hours)
          ) {
            diffFields.push('practiceHours');
          }
          if (
            course.knowledgeBlock &&
            dbRecord.knowledge_block &&
            course.knowledgeBlock !== dbRecord.knowledge_block
          ) {
            diffFields.push('knowledgeBlock');
          }

          if (diffFields.length > 0) {
            hasConflict = true;
            conflictDetails = {
              courseCode,
              dbRecord,
              excelRecord: course,
              diffFields,
            };
            conflicts.push(conflictDetails);
          }
        }

        // Artificial delay for visual processing stream
        await new Promise((r) => setTimeout(r, 20));

        if (hasConflict && conflictDetails) {
          emit({
            type: 'progress',
            current: i + 1,
            total: courses.length,
            message: `⚠️ Phát hiện xung đột tại học phần ${courseCode}: lệch cột [${conflictDetails.diffFields.join(', ')}]`,
            conflict: conflictDetails,
          });
        } else {
          emit({
            type: 'progress',
            current: i + 1,
            total: courses.length,
            message: `✓ Kiểm tra học phần ${courseCode}: Đạt chuẩn, sẵn sàng import.`,
          });
        }
      }

      await saveParseWarnings(this.pool, id, parsed.warnings, true);

      // Save completed results to CSDL
      const parsedJsonData = {
        preview: parsed.preview,
        warnings: parsed.warnings,
        sheets: parsed.sheets,
        activeSheetIndex: parsed.activeSheetIndex,
        conflicts,
      };

      await this.pool.query(
        `UPDATE curriculum_imports SET parsed_json = $1 WHERE id = $2`,
        [JSON.stringify(parsedJsonData), id],
      );

      emit({
        type: 'completed',
        message: 'Bóc tách và đối soát hoàn tất!',
        preview: parsed.preview,
        warnings: parsed.warnings,
        sheets: parsed.sheets,
        activeSheetIndex: parsed.activeSheetIndex,
        conflicts,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Lỗi không xác định';
      emit({
        type: 'error',
        message: `Lỗi trong quá trình xử lý: ${message}`,
      });

      await this.pool.query(
        `UPDATE curriculum_imports SET import_status = 'FAILED', import_error = $1 WHERE id = $2`,
        [message, id],
      );
    } finally {
      if (subject) {
        subject.complete();
        this.progressSubjects.delete(id);
      }
    }
  }

  async confirm(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ message: string }> {
    const importResult = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (importResult.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    const importRecord = importResult.rows[0];
    if (importRecord.import_status !== 'PENDING') {
      throw new BadRequestException('Import is not in PENDING state');
    }

    const courses = payload.courses as ParsedCourseItem[];
    if (!courses || !Array.isArray(courses)) {
      throw new BadRequestException('courses array is required in payload');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await ensureDbSchema(client);
      await insertCurriculumCourses(
        client,
        importRecord.program_id,
        id,
        courses,
      );

      await client.query(
        `UPDATE curriculum_imports SET import_status = 'SUCCESS', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id],
      );

      await client.query('COMMIT');
      return { message: 'Curriculum imported successfully' };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        'Failed to confirm curriculum import: ' + message,
      );
    } finally {
      client.release();
    }
  }

  private buildFilter(query: QueryCurriculumImportsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.import_status) {
      clauses.push(`ci.import_status = $${idx++}`);
      values.push(query.import_status);
    }
    if (query.program_id) {
      clauses.push(`ci.program_id = $${idx++}`);
      values.push(query.program_id);
    }
    if (query.major_name) {
      clauses.push(`p.major_name = $${idx++}`);
      values.push(query.major_name);
    }
    if (query.search) {
      clauses.push(`ci.file_name ILIKE $${idx}`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(
    query: QueryCurriculumImportsDto,
  ): Promise<CurriculumImportResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    values.push(limit, offset);

    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT ci.* FROM curriculum_imports ci 
       LEFT JOIN programs p ON ci.program_id = p.id 
       ${where} ORDER BY ci.uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return result.rows;
  }

  async pagination(
    query: QueryCurriculumImportsDto,
  ): Promise<CurriculumImportsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM curriculum_imports ci 
       LEFT JOIN programs p ON ci.program_id = p.id 
       ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    values.push(limit, offset);

    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT ci.* FROM curriculum_imports ci 
       LEFT JOIN programs p ON ci.program_id = p.id 
       ${where} ORDER BY ci.uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: QueryCurriculumImportsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM curriculum_imports ci 
       LEFT JOIN programs p ON ci.program_id = p.id 
       ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<CurriculumImportResponse> {
    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CurriculumImportResponse> {
    const keys = Object.keys(payload).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CurriculumImportEntity>(
        `UPDATE curriculum_imports SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('curriculum_imports not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      handleDatabaseError(error, 'curriculum_imports');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Delete associated courses
      await client.query(
        `DELETE FROM curriculum_courses WHERE import_id = $1`,
        [id],
      );

      // 2. Delete associated parse warnings
      await client.query(
        `DELETE FROM parse_warnings WHERE source_type = 'CURRICULUM' AND source_id = $1`,
        [id],
      );

      // 3. Delete the curriculum import session
      const result = await client.query(
        `DELETE FROM curriculum_imports WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('curriculum_imports not found');
      }

      await client.query('COMMIT');
      return { message: 'deleted' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
