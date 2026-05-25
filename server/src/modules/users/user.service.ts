import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateUsersDto } from './dto/create-users.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import {
  UserEntity,
  UserResponse,
  UsersPaginationResponse,
} from './interfaces/users.interfaces';

@Injectable()
export class UserService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: CreateUsersDto): Promise<UserResponse> {
    if (!payload.email || !payload.password || !payload.role) {
      throw new BadRequestException('email, password, role are required');
    }

    try {
      const result = await this.pool.query<UserEntity>(
        `
          INSERT INTO users (email, password_hash, role)
          VALUES ($1, $2, $3::user_role)
          RETURNING id, email, role, created_at, updated_at
        `,
        [payload.email.toLowerCase(), payload.password, payload.role],
      );

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }

  private buildFilter(query: QueryUsersDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    const { email, role } = query;

    if (email) {
      clauses.push(`email ILIKE $${idx++}`);
      values.push(`%${email}%`);
    }

    if (role) {
      clauses.push(`role = $${idx++}::user_role`);
      values.push(role);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryUsersDto): Promise<UserResponse[]> {
    const filter = this.buildFilter(query);
    const where = filter.where;
    const values = filter.values;
    let idx = filter.idx;

    const { limit = 20, offset = 0 } = query;
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    values.push(parsedLimit);
    values.push(parsedOffset);

    const result = await this.pool.query<UserResponse>(
      `
        SELECT id, email, role, created_at, updated_at
        FROM users
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++}
        OFFSET $${idx++}
      `,
      values,
    );

    return result.rows;
  }

  async pagination(query: QueryUsersDto): Promise<UsersPaginationResponse> {
    const filter = this.buildFilter(query);
    const where = filter.where;
    const values = filter.values;
    let idx = filter.idx;

    const { page: qPage = 1, limit: qLimit = 20 } = query;
    const page = Math.max(1, Number(qPage));
    const limit = Math.max(1, Number(qLimit));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `
        SELECT COUNT(*) AS total
        FROM users
        ${where}
      `,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const dataValues = [...values, limit, offset];
    const result = await this.pool.query<UserResponse>(
      `
        SELECT id, email, role, created_at, updated_at
        FROM users
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++}
        OFFSET $${idx++}
      `,
      dataValues,
    );

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async countUsers(query: QueryUsersDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<UserResponse> {
    const result = await this.pool.query<UserResponse>(
      `
        SELECT id, email, role, created_at, updated_at
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('user not found');
    }

    return result.rows[0];
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    const result = await this.pool.query<UserEntity>(
      `
        SELECT id, email, password_hash, role, created_at, updated_at
        FROM users
        WHERE email = $1
      `,
      [email.toLowerCase()],
    );

    return result.rows[0] ?? null;
  }

  async update(id: string, payload: UpdateUsersDto): Promise<UserResponse> {
    if (!payload.email && !payload.password && !payload.role) {
      throw new BadRequestException('at least one field is required');
    }

    const fields: string[] = [];
    const values: Array<string> = [];
    let idx = 1;

    if (payload.email) {
      fields.push(`email = $${idx++}`);
      values.push(payload.email.toLowerCase());
    }

    if (payload.password) {
      fields.push(`password_hash = $${idx++}`);
      values.push(payload.password);
    }

    if (payload.role) {
      fields.push(`role = $${idx++}::user_role`);
      values.push(payload.role);
    }

    values.push(id);

    try {
      const result = await this.pool.query<UserResponse>(
        `
          UPDATE users
          SET ${fields.join(', ')}
          WHERE id = $${idx}
          RETURNING id, email, role, created_at, updated_at
        `,
        values,
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('user not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('user not found');
    }

    return { message: 'deleted' };
  }
}
