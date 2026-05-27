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
  CurriculumColumnMappingsPaginationResponse,
  CurriculumColumnMappingEntity,
  CurriculumColumnMappingResponse,
} from './interfaces/curriculum_column_mappings.interfaces';

@Injectable()
export class CurriculumColumnMappingsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CurriculumColumnMappingEntity>(
        `INSERT INTO curriculum_column_mappings (${cols}) VALUES (${params}) RETURNING *`,
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

  private buildFilter(query: Record<string, unknown>): {
    where: string;
    values: Array<unknown>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<unknown> = [];
    let idx = 1;

    Object.entries(query).forEach(([key, value]) => {
      if (
        value === undefined ||
        key === 'page' ||
        key === 'limit' ||
        key === 'offset' ||
        key === 'search'
      ) {
        return;
      }

      clauses.push(`${key} = $${idx++}`);
      values.push(value);
    });

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
      idx,
    };
  }

  async findAll(
    query: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 100);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<CurriculumColumnMappingEntity>(
      `SELECT * FROM curriculum_column_mappings ${where} ORDER BY field_key LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(
    query: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM curriculum_column_mappings ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<CurriculumColumnMappingEntity>(
      `SELECT * FROM curriculum_column_mappings ${where} ORDER BY field_key LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: Record<string, unknown>): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM curriculum_column_mappings ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<CurriculumColumnMappingResponse> {
    const result = await this.pool.query<CurriculumColumnMappingEntity>(
      `SELECT * FROM curriculum_column_mappings WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('mapping not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CurriculumColumnMappingEntity>(
        `UPDATE curriculum_column_mappings SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('mapping not found');
      }

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

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query(
      `DELETE FROM curriculum_column_mappings WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('mapping not found');
    }

    return { message: 'deleted' };
  }
}
