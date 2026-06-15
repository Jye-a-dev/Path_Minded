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

  async create(payload: {
    course_type: string;
    label: string;
    phrases?: string[];
  }): Promise<CourseTypeMappingResponse> {
    if (!payload.course_type || !payload.label) {
      throw new BadRequestException('course_type and label are required');
    }
    const formattedType = payload.course_type.trim().toUpperCase();
    if (!formattedType) {
      throw new BadRequestException('course_type cannot be empty');
    }

    // Safety: ensure it is a safe alphanumeric database identifier to prevent SQL injection in ALTER TYPE
    if (!/^[A-Z0-9_]{2,20}$/.test(formattedType)) {
      throw new BadRequestException(
        'course_type must be 2-20 characters long and contain only uppercase alphanumeric characters or underscores',
      );
    }

    const cleanedPhrases = payload.phrases
      ? payload.phrases.map((p) => p.trim().toLowerCase()).filter(Boolean)
      : [];

    // Check if mapping exists in course_type_mappings table first
    const existingResult = await this.pool.query(
      `SELECT 1 FROM course_type_mappings WHERE course_type = $1`,
      [formattedType],
    );
    if ((existingResult.rowCount ?? 0) > 0) {
      throw new BadRequestException(
        `Loại môn học "${formattedType}" đã tồn tại cấu hình.`,
      );
    }

    // Check if it already exists in the Postgres course_type enum
    const enumCheck = await this.pool.query(
      `SELECT 1 FROM pg_enum 
       WHERE enumtypid = 'course_type'::regtype 
         AND enumlabel = $1`,
      [formattedType],
    );

    if ((enumCheck.rowCount ?? 0) === 0) {
      // Not in the enum, add it dynamically!
      // This is safe to interpolate because formattedType strictly matches /^[A-Z0-9_]{2,20}$/
      await this.pool.query(
        `ALTER TYPE course_type ADD VALUE '${formattedType}'`,
      );
    }

    const result = await this.pool.query<CourseTypeMappingEntity>(
      `INSERT INTO course_type_mappings (course_type, label, phrases)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [formattedType, payload.label.trim(), cleanedPhrases],
    );

    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    // 1. Fetch the target mapping
    const mappingResult = await this.pool.query<CourseTypeMappingEntity>(
      `SELECT * FROM course_type_mappings WHERE id = $1`,
      [id],
    );
    if ((mappingResult.rowCount ?? 0) === 0) {
      throw new NotFoundException('course_type_mapping not found');
    }
    const mapping = mappingResult.rows[0];

    // 2. Prevent deleting if currently assigned to any curriculum courses
    const inUseResult = await this.pool.query(
      `SELECT 1 FROM curriculum_courses WHERE course_type = $1 LIMIT 1`,
      [mapping.course_type],
    );
    if ((inUseResult.rowCount ?? 0) > 0) {
      throw new BadRequestException(
        `Không thể xóa loại môn học "${mapping.label}" vì đang được sử dụng bởi các môn học trong chương trình đào tạo.`,
      );
    }

    // 3. Delete the mapping
    const deleteResult = await this.pool.query(
      `DELETE FROM course_type_mappings WHERE id = $1`,
      [id],
    );
    if ((deleteResult.rowCount ?? 0) === 0) {
      throw new NotFoundException('course_type_mapping not found');
    }
  }
}
