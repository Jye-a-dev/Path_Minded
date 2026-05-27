import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  CourseTypeMappingEntity,
  CourseTypeMappingResponse,
} from './interfaces/course_type_mappings.interfaces';

@Injectable()
export class CourseTypeMappingsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  /**
   * Return all 6 course_type mapping rows.
   */
  async findAll(): Promise<CourseTypeMappingResponse[]> {
    const result = await this.pool.query<CourseTypeMappingEntity>(
      `SELECT * FROM course_type_mappings ORDER BY course_type`,
    );
    return result.rows;
  }

  /**
   * Return a map { course_type → phrases[] } for the pipeline to consume.
   */
  async getMappingConfig(): Promise<Record<string, string[]>> {
    const rows = await this.findAll();
    const config: Record<string, string[]> = {};
    rows.forEach((row) => {
      config[row.course_type] = row.phrases;
    });
    return config;
  }

  async findOne(id: string): Promise<CourseTypeMappingResponse> {
    const result = await this.pool.query<CourseTypeMappingEntity>(
      `SELECT * FROM course_type_mappings WHERE id = $1`,
      [id],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException('course_type_mapping not found');
    }
    return result.rows[0];
  }

  /**
   * Only `phrases` and `label` are updatable.
   * The course_type itself is immutable.
   */
  async update(
    id: string,
    payload: { phrases?: string[]; label?: string },
  ): Promise<CourseTypeMappingResponse> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (payload.label !== undefined) {
      fields.push(`label = $${idx++}`);
      values.push(payload.label);
    }
    if (payload.phrases !== undefined) {
      if (!Array.isArray(payload.phrases)) {
        throw new BadRequestException('phrases must be an array of strings');
      }
      const cleaned = payload.phrases
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
      fields.push(`phrases = $${idx++}`);
      values.push(cleaned);
    }

    if (fields.length === 0) {
      throw new BadRequestException(
        'at least one of phrases or label is required',
      );
    }

    values.push(id);
    const result = await this.pool.query<CourseTypeMappingEntity>(
      `UPDATE course_type_mappings
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${idx}
       RETURNING *`,
      values,
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('course_type_mapping not found');
    }
    return result.rows[0];
  }
}
