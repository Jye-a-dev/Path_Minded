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
  TranscriptUploadsPaginationResponse,
  TranscriptUploadEntity,
  TranscriptUploadResponse,
} from './interfaces/transcript_uploads.interfaces';

@Injectable()
export class TranscriptUploadsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: Record<string, unknown>): Promise<TranscriptUploadResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<TranscriptUploadEntity>(
        `INSERT INTO transcript_uploads (${cols}) VALUES (${params}) RETURNING *`,
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
      if (value === undefined || key === 'page' || key === 'limit' || key === 'offset') {
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

  async findAll(query: Record<string, unknown>): Promise<TranscriptUploadResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads ${where} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(query: Record<string, unknown>): Promise<TranscriptUploadsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM transcript_uploads ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads ${where} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(*) AS count FROM transcript_uploads ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<TranscriptUploadResponse> {
    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('transcript_uploads not found');
    }

    return result.rows[0];
  }

  async update(id: string, payload: Record<string, unknown>): Promise<TranscriptUploadResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<TranscriptUploadEntity>(
        `UPDATE transcript_uploads SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('transcript_uploads not found');
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
    const result = await this.pool.query(`DELETE FROM transcript_uploads WHERE id = $1`, [id]);

    if (result.rowCount === 0) {
      throw new NotFoundException('transcript_uploads not found');
    }

    return { message: 'deleted' };
  }
}
