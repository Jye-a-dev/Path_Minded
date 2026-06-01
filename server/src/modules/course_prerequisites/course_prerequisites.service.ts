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
  CoursePrerequisitesPaginationResponse,
  CoursePrerequisiteEntity,
  CoursePrerequisiteResponse,
} from './interfaces/course_prerequisites.interfaces';

@Injectable()
export class CoursePrerequisitesService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CoursePrerequisiteEntity>(
        `INSERT INTO course_prerequisites (${cols}) VALUES (${params}) RETURNING *`,
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
          `(cp.course_code ILIKE $${idx} OR cp.prerequisite_course_code ILIKE $${idx})`,
        );
        values.push(`%${value as string}%`);
        idx++;
        return;
      }

      clauses.push(`cp.${key} = $${idx++}`);
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
  ): Promise<CoursePrerequisiteResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT cp.*, 
              c1.course_name AS course_name, 
              c2.course_name AS prerequisite_course_name
       FROM course_prerequisites cp
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c1 ON cp.program_id = c1.program_id AND cp.course_code = c1.course_code
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c2 ON cp.program_id = c2.program_id AND cp.prerequisite_course_code = c2.course_code
       ${where} 
       ORDER BY cp.id DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(
    query: Record<string, unknown>,
  ): Promise<CoursePrerequisitesPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM course_prerequisites cp ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT cp.*, 
              c1.course_name AS course_name, 
              c2.course_name AS prerequisite_course_name
       FROM course_prerequisites cp
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c1 ON cp.program_id = c1.program_id AND cp.course_code = c1.course_code
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c2 ON cp.program_id = c2.program_id AND cp.prerequisite_course_code = c2.course_code
       ${where} 
       ORDER BY cp.id DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(*) AS count FROM course_prerequisites cp ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<CoursePrerequisiteResponse> {
    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT * FROM course_prerequisites WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('course_prerequisites not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CoursePrerequisiteEntity>(
        `UPDATE course_prerequisites SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('course_prerequisites not found');
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
      `DELETE FROM course_prerequisites WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('course_prerequisites not found');
    }

    return { message: 'deleted' };
  }
}
