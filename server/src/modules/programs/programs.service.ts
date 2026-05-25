import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateProgramsDto } from './dto/create-programs.dto';
import { QueryProgramsDto } from './dto/query-programs.dto';
import { UpdateProgramsDto } from './dto/update-programs.dto';
import {
  ProgramEntity,
  ProgramsPaginationResponse,
  ProgramResponse,
} from './interfaces/programs.interfaces';

@Injectable()
export class ProgramsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(payload: CreateProgramsDto): Promise<ProgramResponse> {
    if (!payload.program_code || !payload.program_name) {
      throw new BadRequestException(
        'program_code and program_name are required',
      );
    }

    try {
      const result = await this.pool.query<ProgramEntity>(
        `
          INSERT INTO programs (
            program_code,
            program_name,
            major_name,
            version,
            total_credits
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            program_code,
            program_name,
            major_name,
            version,
            total_credits,
            created_at,
            updated_at
        `,
        [
          payload.program_code,
          payload.program_name,
          payload.major_name ?? null,
          payload.version ?? null,
          payload.total_credits ?? null,
        ],
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('program_code and version already exists');
      }
      throw error;
    }
  }

  private buildFilter(query: QueryProgramsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (
      typeof query.program_code === 'string' &&
      query.program_code.length > 0
    ) {
      clauses.push(`program_code ILIKE $${idx++}`);
      values.push(`%${query.program_code}%`);
    }
    if (
      typeof query.program_name === 'string' &&
      query.program_name.length > 0
    ) {
      clauses.push(`program_name ILIKE $${idx++}`);
      values.push(`%${query.program_name}%`);
    }
    if (typeof query.major_name === 'string' && query.major_name.length > 0) {
      clauses.push(`major_name ILIKE $${idx++}`);
      values.push(`%${query.major_name}%`);
    }
    if (typeof query.version === 'string' && query.version.length > 0) {
      clauses.push(`version = $${idx++}`);
      values.push(query.version);
    }
    if (typeof query.total_credits === 'number') {
      clauses.push(`total_credits = $${idx++}`);
      values.push(query.total_credits);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryProgramsDto): Promise<ProgramResponse[]> {
    const filter = this.buildFilter(query);
    const where = filter.where;
    const values = filter.values;
    let idx = filter.idx;
    const parsedLimit = Number(query.limit ?? 20);
    const parsedOffset = Number(query.offset ?? 0);

    values.push(parsedLimit);
    values.push(parsedOffset);

    const result = await this.pool.query<ProgramResponse>(
      `
        SELECT
          id,
          program_code,
          program_name,
          major_name,
          version,
          total_credits,
          created_at,
          updated_at
        FROM programs
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++}
        OFFSET $${idx++}
      `,
      values,
    );
    return result.rows;
  }

  async pagination(
    query: QueryProgramsDto,
  ): Promise<ProgramsPaginationResponse> {
    const filter = this.buildFilter(query);
    const where = filter.where;
    const values = filter.values;
    let idx = filter.idx;
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM programs ${where}`,
      values,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const dataValues = [...values, limit, offset];

    const result = await this.pool.query<ProgramResponse>(
      `
        SELECT
          id,
          program_code,
          program_name,
          major_name,
          version,
          total_credits,
          created_at,
          updated_at
        FROM programs
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++}
        OFFSET $${idx++}
      `,
      dataValues,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async countPrograms(query: QueryProgramsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM programs ${where}`,
      values,
    );
    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<ProgramResponse> {
    const result = await this.pool.query<ProgramResponse>(
      `
        SELECT
          id,
          program_code,
          program_name,
          major_name,
          version,
          total_credits,
          created_at,
          updated_at
        FROM programs
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('program not found');
    }
    return result.rows[0];
  }

  async update(
    id: string,
    payload: UpdateProgramsDto,
  ): Promise<ProgramResponse> {
    if (
      !payload.program_code &&
      !payload.program_name &&
      payload.major_name === undefined &&
      payload.version === undefined &&
      payload.total_credits === undefined
    ) {
      throw new BadRequestException('at least one field is required');
    }

    const fields: string[] = [];
    const values: Array<string | number | null> = [];
    let idx = 1;

    if (payload.program_code) {
      fields.push(`program_code = $${idx++}`);
      values.push(payload.program_code);
    }
    if (payload.program_name) {
      fields.push(`program_name = $${idx++}`);
      values.push(payload.program_name);
    }
    if (payload.major_name !== undefined) {
      fields.push(`major_name = $${idx++}`);
      values.push(payload.major_name ?? null);
    }
    if (payload.version !== undefined) {
      fields.push(`version = $${idx++}`);
      values.push(payload.version ?? null);
    }
    if (payload.total_credits !== undefined) {
      fields.push(`total_credits = $${idx++}`);
      values.push(payload.total_credits ?? null);
    }

    values.push(id);

    try {
      const result = await this.pool.query<ProgramResponse>(
        `
          UPDATE programs
          SET ${fields.join(', ')}
          WHERE id = $${idx}
          RETURNING
            id,
            program_code,
            program_name,
            major_name,
            version,
            total_credits,
            created_at,
            updated_at
        `,
        values,
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('program not found');
      }
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('program_code and version already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query('DELETE FROM programs WHERE id = $1', [
      id,
    ]);
    if (result.rowCount === 0) {
      throw new NotFoundException('program not found');
    }
    return { message: 'deleted' };
  }
}
