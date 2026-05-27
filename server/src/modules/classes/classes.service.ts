import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateClassesDto } from './dto/create-classes.dto';
import { QueryClassesDto } from './dto/query-classes.dto';
import { UpdateClassesDto } from './dto/update-classes.dto';
import {
  ClassEntity,
  ClassesPaginationResponse,
  ClassResponse,
} from './interfaces/classes.interfaces';

@Injectable()
export class ClassesService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: CreateClassesDto): Promise<ClassResponse> {
    if (!payload.class_code) {
      throw new BadRequestException('class_code is required');
    }

    try {
      const result = await this.pool.query<ClassEntity>(
        `
          INSERT INTO classes (advisor_id, program_id, class_code, class_name, cohort_year)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, advisor_id, program_id, class_code, class_name, cohort_year, created_at, updated_at
        `,
        [
          payload.advisor_id ?? null,
          payload.program_id ?? null,
          payload.class_code,
          payload.class_name ?? null,
          payload.cohort_year ?? null,
        ],
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('class_code already exists');
      }
      if (code === '23503') {
        throw new BadRequestException(
          'advisor_id or program_id does not exist',
        );
      }
      throw error;
    }
  }

  private buildFilter(query: QueryClassesDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.class_code) {
      clauses.push(`class_code ILIKE $${idx++}`);
      values.push(`%${query.class_code}%`);
    }
    if (query.class_name) {
      clauses.push(`class_name ILIKE $${idx++}`);
      values.push(`%${query.class_name}%`);
    }
    if (query.cohort_year !== undefined) {
      clauses.push(`cohort_year = $${idx++}`);
      values.push(Number(query.cohort_year));
    }
    if (query.advisor_id) {
      clauses.push(`advisor_id = $${idx++}`);
      values.push(query.advisor_id);
    }
    if (query.program_id) {
      clauses.push(`program_id = $${idx++}`);
      values.push(query.program_id);
    }
    if (query.search) {
      clauses.push(`(class_code ILIKE $${idx} OR class_name ILIKE $${idx})`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryClassesDto): Promise<ClassResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    const params = [...values, limit, offset];

    const result = await this.pool.query<ClassResponse>(
      `
        SELECT id, advisor_id, program_id, class_code, class_name, cohort_year, created_at, updated_at
        FROM classes
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      params,
    );

    return result.rows;
  }

  async pagination(query: QueryClassesDto): Promise<ClassesPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM classes ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const params = [...values, limit, offset];

    const result = await this.pool.query<ClassResponse>(
      `
        SELECT id, advisor_id, program_id, class_code, class_name, cohort_year, created_at, updated_at
        FROM classes
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      params,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async countClasses(query: QueryClassesDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM classes ${where}`,
      values,
    );
    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<ClassResponse> {
    const result = await this.pool.query<ClassResponse>(
      `
        SELECT id, advisor_id, program_id, class_code, class_name, cohort_year, created_at, updated_at
        FROM classes
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('class not found');
    }

    return result.rows[0];
  }

  async update(id: string, payload: UpdateClassesDto): Promise<ClassResponse> {
    if (
      !payload.class_code &&
      payload.class_name === undefined &&
      payload.cohort_year === undefined &&
      payload.advisor_id === undefined &&
      payload.program_id === undefined
    ) {
      throw new BadRequestException('at least one field is required');
    }

    const fields: string[] = [];
    const values: Array<string | number | null> = [];
    let idx = 1;

    if (payload.class_code) {
      fields.push(`class_code = $${idx++}`);
      values.push(payload.class_code);
    }
    if (payload.class_name !== undefined) {
      fields.push(`class_name = $${idx++}`);
      values.push(payload.class_name ?? null);
    }
    if (payload.cohort_year !== undefined) {
      fields.push(`cohort_year = $${idx++}`);
      values.push(payload.cohort_year ?? null);
    }
    if (payload.advisor_id !== undefined) {
      fields.push(`advisor_id = $${idx++}`);
      values.push(payload.advisor_id ?? null);
    }
    if (payload.program_id !== undefined) {
      fields.push(`program_id = $${idx++}`);
      values.push(payload.program_id ?? null);
    }

    values.push(id);

    try {
      const result = await this.pool.query<ClassResponse>(
        `
          UPDATE classes
          SET ${fields.join(', ')}
          WHERE id = $${idx}
          RETURNING id, advisor_id, program_id, class_code, class_name, cohort_year, created_at, updated_at
        `,
        values,
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('class not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('class_code already exists');
      }
      if (code === '23503') {
        throw new BadRequestException(
          'advisor_id or program_id does not exist',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query('DELETE FROM classes WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('class not found');
    }
    return { message: 'deleted' };
  }
}
