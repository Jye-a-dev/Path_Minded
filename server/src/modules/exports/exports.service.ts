/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  ExportsPaginationResponse,
  ExportEntity,
  ExportResponse,
} from './interfaces/exports.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryExportsDto } from './dto/query-exports.dto';

export interface MatrixPreviewData {
  classInfo: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    program_id: string;
  };
  programInfo: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    total_credits: number | null;
  };
  students: Array<{
    id: string;
    student_code: string;
    full_name: string;
    advisor_feedback: string | null;
  }>;
  courses: Array<{
    course_code: string;
    course_name: string;
    credits: number | null;
    theory_hours: number | null;
    practice_hours: number | null;
    project_hours: number | null;
    internship_hours: number | null;
    expected_semester: number | null;
    course_type: string;
    is_required: boolean;
    prerequisite: string | null;
    corequisite: string | null;
    organizing_semester: string | null;
    knowledge_block: string | null;
    course_group: string | null;
  }>;
  results: Array<{
    id?: string;
    student_id: string;
    course_code: string;
    status: string;
    semester_number: number | null;
    score_10: number | null;
    letter_grade: string | null;
    school_year: string | null;
    semester_code: string | null;
  }>;
}

@Injectable()
export class ExportsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async exportMatrix(classId: string, advisorId?: string): Promise<Buffer> {
    const classResult = await this.pool.query(
      `SELECT * FROM classes WHERE id = $1`,
      [classId],
    );

    if (classResult.rowCount === 0) {
      throw new NotFoundException('Class not found');
    }

    const classData = classResult.rows[0];
    const programId = classData.program_id;

    if (!programId) {
      throw new BadRequestException('Class has no program assigned');
    }

    // Load students
    const studentsResult = await this.pool.query(
      `SELECT id, student_code, full_name FROM students WHERE class_id = $1 ORDER BY student_code`,
      [classId],
    );
    const students = studentsResult.rows;

    // Load curriculum courses
    const coursesResult = await this.pool.query(
      `SELECT course_code, course_name, expected_semester, credits 
       FROM curriculum_courses 
       WHERE program_id = $1 
       ORDER BY expected_semester, course_code`,
      [programId],
    );
    const courses = coursesResult.rows;

    // Load student course results
    const resultsResult = await this.pool.query(
      `SELECT scr.student_id, scr.course_code, scr.status, scr.semester_number 
       FROM student_course_results scr
       INNER JOIN students s ON s.id = scr.student_id
       WHERE s.class_id = $1 AND scr.is_latest = true`,
      [classId],
    );
    const results = resultsResult.rows;

    // Generate Excel using pipeline server
    const pipelineUrl =
      process.env.PIPELINE_SERVER_URL || 'http://localhost:5101';

    const response = await fetch(`${pipelineUrl}/exports/matrix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        students,
        courses,
        results: results.map((r) => ({
          studentId: r.student_id,
          courseCode: r.course_code,
          status: r.status,
          semesterNumber: r.semester_number,
        })),
      }),
    });

    if (!response.ok) {
      throw new BadRequestException(
        'Pipeline server error: ' + response.statusText,
      );
    }

    const parsedData = (await response.json()) as {
      buffer: string;
      successCount: number;
      warningCount: number;
    };
    const buffer = Buffer.from(parsedData.buffer, 'base64');
    const successCount = parsedData.successCount;
    const warningCount = parsedData.warningCount;

    // Log Export
    const fileName = `Matrix_${classData.class_code}_${Date.now()}.xlsx`;
    const insertExport = await this.pool.query(
      `INSERT INTO exports (advisor_id, class_id, program_id, file_name, export_type)
       VALUES ($1, $2, $3, $4, 'MATRIX') RETURNING id`,
      [advisorId || null, classId, programId, fileName],
    );

    const exportId = insertExport.rows[0].id;
    await this.pool.query(
      `INSERT INTO export_logs (export_id, student_count, course_count, success_count, warning_count)
       VALUES ($1, $2, $3, $4, $5)`,
      [exportId, students.length, courses.length, successCount, warningCount],
    );

    return buffer;
  }

  async getMatrixPreview(classId: string): Promise<MatrixPreviewData> {
    const classResult = await this.pool.query(
      `SELECT c.*, p.program_code, p.program_name, p.major_name, p.total_credits
       FROM classes c
       LEFT JOIN programs p ON p.id = c.program_id
       WHERE c.id = $1`,
      [classId],
    );

    if (classResult.rowCount === 0) {
      throw new NotFoundException('Class not found');
    }

    const row = classResult.rows[0];
    const programId = row.program_id;

    if (!programId) {
      throw new BadRequestException('Class has no program assigned');
    }

    const [studentsResult, coursesResult, resultsResult] = await Promise.all([
      this.pool.query(
        `SELECT id, student_code, full_name, advisor_feedback FROM students WHERE class_id = $1 ORDER BY student_code`,
        [classId],
      ),
      this.pool.query(
        `SELECT course_code, course_name, credits, theory_hours, practice_hours, project_hours,
                internship_hours, expected_semester, course_type, is_required, prerequisite,
                corequisite, organizing_semester, knowledge_block, course_group
         FROM curriculum_courses
         WHERE program_id = $1
         ORDER BY expected_semester NULLS LAST, knowledge_block, course_code`,
        [programId],
      ),
      this.pool.query(
        `SELECT scr.id, scr.student_id, scr.course_code, scr.status, scr.semester_number, scr.score_10, scr.letter_grade, scr.school_year, scr.semester_code
         FROM student_course_results scr
         INNER JOIN students s ON s.id = scr.student_id
         WHERE s.class_id = $1 AND scr.is_latest = true`,
        [classId],
      ),
    ]);

    return {
      classInfo: {
        class_code: row.class_code as string,
        class_name: row.class_name as string | null,
        cohort_year: row.cohort_year as number | null,
        program_id: programId as string,
      },
      programInfo: {
        program_code: row.program_code as string,
        program_name: row.program_name as string,
        major_name: row.major_name as string | null,
        total_credits: row.total_credits as number | null,
      },
      students: studentsResult.rows as MatrixPreviewData['students'],
      courses: coursesResult.rows as MatrixPreviewData['courses'],
      results: resultsResult.rows as MatrixPreviewData['results'],
    };
  }

  async create(payload: Record<string, unknown>): Promise<ExportResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<ExportEntity>(
        `INSERT INTO exports (${cols}) VALUES (${params}) RETURNING *`,
        values,
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('duplicate key');
      }
      if (code === '23503') {
        throw new BadRequestException('invalid foreign key');
      }
      throw error;
    }
  }

  private buildFilter(query: QueryExportsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.export_type) {
      clauses.push(`export_type = $${idx++}`);
      values.push(query.export_type);
    }
    if (query.class_id) {
      clauses.push(`class_id = $${idx++}`);
      values.push(query.class_id);
    }
    if (query.search) {
      clauses.push(`file_name ILIKE $${idx}`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryExportsDto): Promise<ExportResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    values.push(limit, offset);

    const result = await this.pool.query<ExportEntity>(
      `SELECT * FROM exports ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return result.rows;
  }

  async pagination(query: QueryExportsDto): Promise<ExportsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM exports ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    values.push(limit, offset);

    const result = await this.pool.query<ExportEntity>(
      `SELECT * FROM exports ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: QueryExportsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM exports ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<ExportResponse> {
    const result = await this.pool.query<ExportEntity>(
      `SELECT * FROM exports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('exports not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<ExportResponse> {
    const keys = Object.keys(payload).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<ExportEntity>(
        `UPDATE exports SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('exports not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      handleDatabaseError(error, 'exports');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query(`DELETE FROM exports WHERE id = $1`, [
      id,
    ]);

    if (result.rowCount === 0) {
      throw new NotFoundException('exports not found');
    }

    return { message: 'deleted' };
  }
}
