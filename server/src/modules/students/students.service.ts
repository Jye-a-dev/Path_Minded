import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateStudentsDto } from './dto/create-students.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentsDto } from './dto/update-students.dto';
import {
  StudentEntity,
  StudentsPaginationResponse,
  StudentResponse,
} from './interfaces/students.interfaces';

@Injectable()
export class StudentsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: CreateStudentsDto): Promise<StudentResponse> {
    if (!payload.student_code || !payload.full_name) {
      throw new BadRequestException('student_code and full_name are required');
    }

    try {
      const result = await this.pool.query<StudentEntity>(
        `
          INSERT INTO students (
            user_id,
            student_code,
            full_name,
            class_id,
            program_id,
            cohort_year,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::student_status)
          RETURNING id, user_id, student_code, full_name, class_id, program_id, cohort_year, status, created_at, updated_at
        `,
        [
          payload.user_id ?? null,
          payload.student_code,
          payload.full_name,
          payload.class_id ?? null,
          payload.program_id ?? null,
          payload.cohort_year ?? null,
          payload.status ?? 'ACTIVE',
        ],
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('student_code or user_id already exists');
      }
      if (code === '23503') {
        throw new BadRequestException(
          'user_id, class_id, or program_id does not exist',
        );
      }
      throw error;
    }
  }

  private buildFilter(query: QueryStudentsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.student_code) {
      clauses.push(`student_code ILIKE $${idx++}`);
      values.push(`%${query.student_code}%`);
    }
    if (query.full_name) {
      clauses.push(`full_name ILIKE $${idx++}`);
      values.push(`%${query.full_name}%`);
    }
    if (query.user_id) {
      clauses.push(`user_id = $${idx++}`);
      values.push(query.user_id);
    }
    if (query.class_id) {
      clauses.push(`class_id = $${idx++}`);
      values.push(query.class_id);
    }
    if (query.program_id) {
      clauses.push(`program_id = $${idx++}`);
      values.push(query.program_id);
    }
    if (query.cohort_year !== undefined) {
      clauses.push(`cohort_year = $${idx++}`);
      values.push(Number(query.cohort_year));
    }
    if (query.status) {
      clauses.push(`status = $${idx++}::student_status`);
      values.push(query.status);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryStudentsDto): Promise<StudentResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<StudentResponse>(
      `
        SELECT id, user_id, student_code, full_name, class_id, program_id, cohort_year, status, created_at, updated_at
        FROM students
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(
    query: QueryStudentsDto,
  ): Promise<StudentsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM students ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<StudentResponse>(
      `
        SELECT id, user_id, student_code, full_name, class_id, program_id, cohort_year, status, created_at, updated_at
        FROM students
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      [...values, limit, offset],
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async countStudents(query: QueryStudentsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM students ${where}`,
      values,
    );
    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<StudentResponse> {
    const result = await this.pool.query<StudentResponse>(
      `
        SELECT id, user_id, student_code, full_name, class_id, program_id, cohort_year, status, created_at, updated_at
        FROM students
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('student not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: UpdateStudentsDto,
  ): Promise<StudentResponse> {
    if (
      !payload.student_code &&
      !payload.full_name &&
      payload.user_id === undefined &&
      payload.class_id === undefined &&
      payload.program_id === undefined &&
      payload.cohort_year === undefined &&
      payload.status === undefined
    ) {
      throw new BadRequestException('at least one field is required');
    }

    const fields: string[] = [];
    const values: Array<string | number | null> = [];
    let idx = 1;

    if (payload.student_code) {
      fields.push(`student_code = $${idx++}`);
      values.push(payload.student_code);
    }
    if (payload.full_name) {
      fields.push(`full_name = $${idx++}`);
      values.push(payload.full_name);
    }
    if (payload.user_id !== undefined) {
      fields.push(`user_id = $${idx++}`);
      values.push(payload.user_id ?? null);
    }
    if (payload.class_id !== undefined) {
      fields.push(`class_id = $${idx++}`);
      values.push(payload.class_id ?? null);
    }
    if (payload.program_id !== undefined) {
      fields.push(`program_id = $${idx++}`);
      values.push(payload.program_id ?? null);
    }
    if (payload.cohort_year !== undefined) {
      fields.push(`cohort_year = $${idx++}`);
      values.push(payload.cohort_year ?? null);
    }
    if (payload.status !== undefined) {
      fields.push(`status = $${idx++}::student_status`);
      values.push(payload.status);
    }

    values.push(id);

    try {
      const result = await this.pool.query<StudentResponse>(
        `
          UPDATE students
          SET ${fields.join(', ')}
          WHERE id = $${idx}
          RETURNING id, user_id, student_code, full_name, class_id, program_id, cohort_year, status, created_at, updated_at
        `,
        values,
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('student not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('student_code or user_id already exists');
      }
      if (code === '23503') {
        throw new BadRequestException(
          'user_id, class_id, or program_id does not exist',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query('DELETE FROM students WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('student not found');
    }
    return { message: 'deleted' };
  }
}
