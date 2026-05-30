import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  KnowledgeBlockMappingEntity,
  KnowledgeBlockMappingResponse,
} from './interfaces/knowledge_block_mappings.interfaces';

@Injectable()
export class KnowledgeBlockMappingsService implements OnModuleInit {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    const client = await this.pool.connect();
    try {
      // 1. Drop old constraint
      try {
        await client.query(`
          ALTER TABLE curriculum_courses 
          DROP CONSTRAINT IF EXISTS curriculum_courses_program_id_course_code_key
        `);
      } catch (err) {
        console.warn(
          'Note: Could not drop old constraint:',
          err instanceof Error ? err.message : err,
        );
      }

      // 2. Add new constraint
      try {
        await client.query(`
          ALTER TABLE curriculum_courses 
          ADD CONSTRAINT curriculum_courses_program_id_course_code_course_type_key 
          UNIQUE (program_id, course_code, course_type)
        `);
      } catch {
        // Safe to ignore if constraint already exists
      }

      // 3. Add column knowledge_block
      try {
        await client.query(`
          ALTER TABLE curriculum_courses ADD COLUMN IF NOT EXISTS knowledge_block VARCHAR(50) DEFAULT 'GENERAL'
        `);
      } catch (err) {
        console.error(
          'Failed to add knowledge_block column to curriculum_courses:',
          err,
        );
      }

      // 4. Create mappings table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS knowledge_block_mappings (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              knowledge_block VARCHAR(50) NOT NULL UNIQUE,
              label VARCHAR(100) NOT NULL,
              phrases TEXT[] NOT NULL DEFAULT '{}',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } catch (err) {
        console.error('Failed to create knowledge_block_mappings table:', err);
      }

      // 5. Seed default values
      try {
        await client.query(`
          INSERT INTO knowledge_block_mappings (knowledge_block, label, phrases) VALUES
          ('GENERAL',     'Đại cương',            ARRAY['đại cương','chính trị','mác-lênin','ngoại ngữ','tiếng anh','thể chất','quốc phòng','pháp luật','kỹ năng']),
          ('SECTOR_CORE',  'Cơ sở khối ngành',     ARRAY['cơ sở khối ngành','cơ sở nhóm ngành','khối ngành']),
          ('MAJOR_CORE',   'Cơ sở ngành',          ARRAY['cơ sở ngành','nền tảng','cơ bản','toán','lập trình','cấu trúc dữ liệu']),
          ('SPECIALIZED',  'Chuyên ngành',         ARRAY['chuyên ngành','chuyên sâu','tốt nghiệp','thực tập','đồ án','chuyên đề'])
          ON CONFLICT (knowledge_block) DO NOTHING
        `);
      } catch (err) {
        console.error(
          'Failed to seed default values in knowledge_block_mappings:',
          err,
        );
      }

      console.log(
        'KnowledgeBlockMappings database migrations completed successfully.',
      );
    } catch (error) {
      console.error(
        'Failed to run KnowledgeBlockMappings database migrations:',
        error,
      );
    } finally {
      client.release();
    }
  }

  async findAll(): Promise<KnowledgeBlockMappingResponse[]> {
    const result = await this.pool.query<KnowledgeBlockMappingEntity>(
      `SELECT * FROM knowledge_block_mappings ORDER BY knowledge_block`,
    );
    return result.rows;
  }

  /** Returns course counts grouped by knowledge_block → program */
  async getStats(): Promise<
    {
      knowledge_block: string;
      program_id: string;
      program_code: string;
      program_name: string;
      course_count: number;
    }[]
  > {
    const result = await this.pool.query<{
      knowledge_block: string;
      program_id: string;
      program_code: string;
      program_name: string;
      course_count: string;
    }>(`
      SELECT
        cc.knowledge_block,
        p.id        AS program_id,
        p.program_code,
        p.program_name,
        COUNT(cc.id)::int AS course_count
      FROM curriculum_courses cc
      JOIN programs p ON p.id = cc.program_id
      GROUP BY cc.knowledge_block, p.id, p.program_code, p.program_name
      ORDER BY cc.knowledge_block, p.program_code
    `);
    return result.rows.map((r) => ({
      ...r,
      course_count: Number(r.course_count),
    }));
  }

  async findOne(id: string): Promise<KnowledgeBlockMappingResponse> {
    const result = await this.pool.query<KnowledgeBlockMappingEntity>(
      `SELECT * FROM knowledge_block_mappings WHERE id = $1`,
      [id],
    );
    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException('knowledge_block_mapping not found');
    }
    return result.rows[0];
  }

  async create(payload: {
    knowledge_block: string;
    label: string;
    phrases?: string[];
  }): Promise<KnowledgeBlockMappingResponse> {
    if (!payload.knowledge_block || !payload.label) {
      throw new BadRequestException('knowledge_block and label are required');
    }
    const formattedBlock = payload.knowledge_block.trim().toUpperCase();
    if (!formattedBlock) {
      throw new BadRequestException('knowledge_block cannot be empty');
    }

    if (!/^[A-Z0-9_]{2,30}$/.test(formattedBlock)) {
      throw new BadRequestException(
        'knowledge_block must be 2-30 characters long and contain only uppercase alphanumeric characters or underscores',
      );
    }

    const cleanedPhrases = payload.phrases
      ? payload.phrases.map((p) => p.trim().toLowerCase()).filter(Boolean)
      : [];

    // Check conflict
    const existingResult = await this.pool.query(
      `SELECT 1 FROM knowledge_block_mappings WHERE knowledge_block = $1`,
      [formattedBlock],
    );
    if ((existingResult.rowCount ?? 0) > 0) {
      throw new BadRequestException(
        `Khối kiến thức "${formattedBlock}" đã tồn tại cấu hình.`,
      );
    }

    const result = await this.pool.query<KnowledgeBlockMappingEntity>(
      `INSERT INTO knowledge_block_mappings (knowledge_block, label, phrases)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [formattedBlock, payload.label.trim(), cleanedPhrases],
    );

    return result.rows[0];
  }

  async update(
    id: string,
    payload: { phrases?: string[]; label?: string },
  ): Promise<KnowledgeBlockMappingResponse> {
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
    const result = await this.pool.query<KnowledgeBlockMappingEntity>(
      `UPDATE knowledge_block_mappings
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${idx}
       RETURNING *`,
      values,
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new NotFoundException('knowledge_block_mapping not found');
    }
    return result.rows[0];
  }

  async delete(id: string): Promise<void> {
    // Fetch target mapping
    const mappingResult = await this.pool.query<KnowledgeBlockMappingEntity>(
      `SELECT * FROM knowledge_block_mappings WHERE id = $1`,
      [id],
    );
    if ((mappingResult.rowCount ?? 0) === 0) {
      throw new NotFoundException('knowledge_block_mapping not found');
    }
    const mapping = mappingResult.rows[0];

    // Prevent deleting if currently assigned to any curriculum courses
    const inUseResult = await this.pool.query(
      `SELECT 1 FROM curriculum_courses WHERE knowledge_block = $1 LIMIT 1`,
      [mapping.knowledge_block],
    );
    if ((inUseResult.rowCount ?? 0) > 0) {
      throw new BadRequestException(
        `Không thể xóa khối kiến thức "${mapping.label}" vì đang được sử dụng bởi các môn học trong chương trình đào tạo.`,
      );
    }

    // Delete mapping
    const deleteResult = await this.pool.query(
      `DELETE FROM knowledge_block_mappings WHERE id = $1`,
      [id],
    );
    if ((deleteResult.rowCount ?? 0) === 0) {
      throw new NotFoundException('knowledge_block_mapping not found');
    }
  }
}
