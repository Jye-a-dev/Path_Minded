import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateUsersDto } from './dto/create_users.dto';
import { QuerryUsersDto } from './dto/querry_users.dto';
import { UpdateUsersDto } from './dto/update_users.dto';
import { UserEntity, UserResponse } from './interfaces/users.interfaces';

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

  async findAll(query: QuerryUsersDto): Promise<UserResponse[]> {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.email) {
      clauses.push(`email ILIKE $${idx++}`);
      values.push(`%${query.email}%`);
    }

    if (query.role) {
      clauses.push(`role = $${idx++}::user_role`);
      values.push(query.role);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    values.push(limit);
    values.push(offset);

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
