import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateAdvisorsDto } from './dto/create-advisors.dto';
import { QueryAdvisorsDto } from './dto/query-advisors.dto';
import { UpdateAdvisorsDto } from './dto/update-advisors.dto';
import {
  AdvisorEntity,
  AdvisorsPaginationResponse,
  AdvisorResponse,
} from './interfaces/advisors.interfaces';

@Injectable()
export class AdvisorsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: CreateAdvisorsDto): Promise<AdvisorResponse> {
    if (!payload.user_id || !payload.full_name) {
      throw new BadRequestException('user_id and full_name are required');
    }

    try {
      const result = await this.pool.query<AdvisorEntity>(
        `
          INSERT INTO advisors (user_id, full_name, department)
          VALUES ($1, $2, $3)
          RETURNING id, user_id, full_name, department, created_at, updated_at
        `,
        [payload.user_id, payload.full_name, payload.department ?? null],
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('advisor user_id already exists');
      }
      if (code === '23503') {
        throw new BadRequestException('user_id does not exist');
      }
      throw error;
    }
  }

  private buildFilter(query: QueryAdvisorsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.full_name) {
      clauses.push(`a.full_name ILIKE $${idx++}`);
      values.push(`%${query.full_name}%`);
    }
    if (query.department) {
      clauses.push(`a.department ILIKE $${idx++}`);
      values.push(`%${query.department}%`);
    }
    if (query.user_id) {
      clauses.push(`a.user_id = $${idx++}`);
      values.push(query.user_id);
    }
    if (query.search) {
      clauses.push(
        `(a.full_name ILIKE $${idx} OR a.department ILIKE $${idx} OR u.email ILIKE $${idx})`,
      );
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryAdvisorsDto): Promise<AdvisorResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    const params = [...values, limit, offset];

    const result = await this.pool.query<AdvisorResponse>(
      `
        SELECT a.id, a.user_id, a.full_name, a.department, a.created_at, a.updated_at, u.email
        FROM advisors a
        LEFT JOIN users u ON a.user_id = u.id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT $${idx}
        OFFSET $${idx + 1}
      `,
      params,
    );

    return result.rows;
  }

  async pagination(
    query: QueryAdvisorsDto,
  ): Promise<AdvisorsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM advisors a LEFT JOIN users u ON a.user_id = u.id ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const params = [...values, limit, offset];

    const result = await this.pool.query<AdvisorResponse>(
      `
        SELECT a.id, a.user_id, a.full_name, a.department, a.created_at, a.updated_at, u.email
        FROM advisors a
        LEFT JOIN users u ON a.user_id = u.id
        ${where}
        ORDER BY a.created_at DESC
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

  async countAdvisors(query: QueryAdvisorsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM advisors a LEFT JOIN users u ON a.user_id = u.id ${where}`,
      values,
    );
    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<AdvisorResponse> {
    const result = await this.pool.query<AdvisorResponse>(
      `
        SELECT a.id, a.user_id, a.full_name, a.department, a.created_at, a.updated_at, u.email
        FROM advisors a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('advisor not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: UpdateAdvisorsDto,
  ): Promise<AdvisorResponse> {
    if (
      !payload.user_id &&
      !payload.full_name &&
      payload.department === undefined
    ) {
      throw new BadRequestException('at least one field is required');
    }

    const fields: string[] = [];
    const values: Array<string | null> = [];
    let idx = 1;

    if (payload.user_id) {
      fields.push(`user_id = $${idx++}`);
      values.push(payload.user_id);
    }
    if (payload.full_name) {
      fields.push(`full_name = $${idx++}`);
      values.push(payload.full_name);
    }
    if (payload.department !== undefined) {
      fields.push(`department = $${idx++}`);
      values.push(payload.department ?? null);
    }

    values.push(id);

    try {
      const result = await this.pool.query<AdvisorResponse>(
        `
          UPDATE advisors
          SET ${fields.join(', ')}
          WHERE id = $${idx}
          RETURNING id, user_id, full_name, department, created_at, updated_at
        `,
        values,
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('advisor not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('advisor user_id already exists');
      }
      if (code === '23503') {
        throw new BadRequestException('user_id does not exist');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query('DELETE FROM advisors WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('advisor not found');
    }
    return { message: 'deleted' };
  }
}
