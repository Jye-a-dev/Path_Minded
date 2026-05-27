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
  ParseWarningsPaginationResponse,
  ParseWarningEntity,
  ParseWarningResponse,
} from './interfaces/parse_warnings.interfaces';

@Injectable()
export class ParseWarningsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
  ): Promise<ParseWarningResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<ParseWarningEntity>(
        `INSERT INTO parse_warnings (${cols}) VALUES (${params}) RETURNING *`,
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
    values: Array<string | number | boolean>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number | boolean> = [];
    let idx = 1;

    Object.entries(query).forEach(([key, value]) => {
      if (
        value === undefined ||
        key === 'page' ||
        key === 'limit' ||
        key === 'offset'
      ) {
        return;
      }

      if (key === 'search') {
        clauses.push(
          `(warning_message ILIKE $${idx} OR warning_code ILIKE $${idx})`,
        );
        values.push(`%${value}%`);
        idx++;
        return;
      }

      clauses.push(`${key} = $${idx++}`);
      values.push(value as string | number | boolean);
    });

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
      idx,
    };
  }

  async findAll(
    query: Record<string, unknown>,
  ): Promise<ParseWarningResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<ParseWarningEntity>(
      `SELECT * FROM parse_warnings ${where} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(
    query: Record<string, unknown>,
  ): Promise<ParseWarningsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM parse_warnings ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<ParseWarningEntity>(
      `SELECT * FROM parse_warnings ${where} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(*) AS count FROM parse_warnings ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<ParseWarningResponse> {
    const result = await this.pool.query<ParseWarningEntity>(
      `SELECT * FROM parse_warnings WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('parse_warnings not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<ParseWarningResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<ParseWarningEntity>(
        `UPDATE parse_warnings SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('parse_warnings not found');
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
      `DELETE FROM parse_warnings WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('parse_warnings not found');
    }

    return { message: 'deleted' };
  }

  async removeAll(): Promise<{ message: string; count: number }> {
    const result = await this.pool.query('DELETE FROM parse_warnings');
    return { message: 'all deleted', count: result.rowCount ?? 0 };
  }
}
