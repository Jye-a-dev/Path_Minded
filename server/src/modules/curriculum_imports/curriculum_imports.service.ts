/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
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

@Injectable()
export class CurriculumImportsService implements OnModuleInit {
  constructor(
    @Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool,
    private readonly courseTypeMappingsService: CourseTypeMappingsService,
  ) {}

  async onModuleInit() {
    console.log(
      'Running automated one-off prerequisite parsing and migration...',
    );
    const client = await this.pool.connect();
    try {
      // Fetch all courses that have prerequisites from database
      const coursesResult = await client.query<{
        program_id: string;
        course_code: string;
        prerequisite: string | null;
      }>(
        `SELECT program_id, course_code, prerequisite 
         FROM curriculum_courses 
         WHERE prerequisite IS NOT NULL AND prerequisite <> ''`,
      );

      const courses = coursesResult.rows;
      if (courses.length > 0) {
        console.log(
          `Found ${courses.length} courses with prerequisites. Populating course_prerequisites table...`,
        );
        for (const course of courses) {
          const prereqs = parsePrerequisites(course.prerequisite);
          for (const prereqCode of prereqs) {
            if (prereqCode === course.course_code) continue;

            await client.query(
              `INSERT INTO course_prerequisites (program_id, course_code, prerequisite_course_code, prerequisite_type)
               VALUES ($1, $2, $3, 'REQUIRED')
               ON CONFLICT (program_id, course_code, prerequisite_course_code) 
               DO NOTHING`,
              [course.program_id, course.course_code, prereqCode],
            );
          }
        }
        console.log('Automated prerequisite migration completed.');
      }
    } catch (err) {
      console.error('Failed to run prerequisite migration:', err);
    } finally {
      client.release();
    }
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

    const courseTypeMappingConfig =
      await this.courseTypeMappingsService.getMappingConfig();

    try {
      const parsed = await parseCurriculumWithPipeline(
        this.pool,
        courseTypeMappingConfig,
        {
          file: file
            ? {
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
              }
            : null,
          textContent: (payload.textContent as string) || null,
        },
      );

      await saveParseWarnings(this.pool, importRecord.id, parsed.warnings);

      return {
        importSession: importRecord,
        preview: parsed.preview,
        warnings: parsed.warnings,
        sheets: parsed.sheets,
        activeSheetIndex: parsed.activeSheetIndex,
      };
    } catch (error: any) {
      await this.pool.query(
        `UPDATE curriculum_imports SET import_status = 'FAILED', import_error = $1 WHERE id = $2`,
        [error.message || 'Unknown error', importRecord.id],
      );
      throw new BadRequestException(
        'Failed to process with pipeline server: ' + error.message,
      );
    }
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

    const courseTypeMappingConfig =
      await this.courseTypeMappingsService.getMappingConfig();

    try {
      const parsed = await parseCurriculumWithPipeline(
        this.pool,
        courseTypeMappingConfig,
        {
          file: {
            buffer: fileBuffer,
            originalname: importRecord.file_name,
            mimetype:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          sheetIndex,
        },
      );

      await saveParseWarnings(this.pool, id, parsed.warnings, true);

      return {
        importSession: importRecord,
        preview: parsed.preview,
        warnings: parsed.warnings,
        sheets: parsed.sheets,
        activeSheetIndex: parsed.activeSheetIndex,
      };
    } catch (error: any) {
      throw new BadRequestException(
        'Failed to reparse with pipeline server: ' + error.message,
      );
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
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException(
        'Failed to confirm curriculum import: ' + error.message,
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
    await this.pool.query(
      `DELETE FROM curriculum_courses WHERE import_id = $1`,
      [id],
    );

    const result = await this.pool.query(
      `DELETE FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    return { message: 'deleted' };
  }
}
