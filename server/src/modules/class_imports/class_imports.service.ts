/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
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
  ClassImportsPaginationResponse,
  ClassImportEntity,
  ClassImportResponse,
} from './interfaces/class_imports.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryClassImportsDto } from './dto/query-class-imports.dto';

@Injectable()
export class ClassImportsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
    file?: Express.Multer.File,
  ): Promise<any> {
    const advisorId = payload.advisorId as string;
    const classId = payload.classId as string;

    const fileName = file ? file.originalname : 'Pasted Text';

    const insertResult = await this.pool.query<ClassImportEntity>(
      `INSERT INTO class_imports (advisor_id, class_id, file_name, import_status) 
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [advisorId || null, classId || null, fileName],
    );
    const importRecord = insertResult.rows[0];

    // Fetch active column mappings from database
    const mappingResult = await this.pool.query<{
      field_key: string;
      phrases: string[];
    }>('SELECT field_key, phrases FROM curriculum_column_mappings');
    const mappingConfig: Record<string, string[]> = {};
    mappingResult.rows.forEach((row) => {
      mappingConfig[row.field_key] = row.phrases;
    });

    const pipelineUrl =
      process.env.PIPELINE_SERVER_URL || 'http://localhost:5100';
    const formData = new FormData();
    formData.append('columnMappings', JSON.stringify(mappingConfig));
    if (file) {
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
      });
      formData.append('file', blob, file.originalname);
    } else if (payload.textContent) {
      formData.append('textContent', payload.textContent as string);
    }

    try {
      const response = await fetch(`${pipelineUrl}/parse/class`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pipeline error: ${response.statusText}`);
      }
      const parsedData = (await response.json()) as {
        students?: any[];
        warnings?: any[];
        preview?: any[];
      };

      // Save parsed rows
      if (parsedData.students && parsedData.students.length > 0) {
        for (const [idx, student] of parsedData.students.entries()) {
          await this.pool.query(
            `INSERT INTO class_import_rows (import_id, row_number, student_code, full_name, email, row_status, row_error)
             VALUES ($1, $2, $3, $4, $5, 'PENDING', null)`,
            [
              importRecord.id,
              idx + 1,
              student.studentCode,
              student.fullName,
              student.email || null,
            ],
          );
        }
      }

      if (parsedData.warnings && parsedData.warnings.length > 0) {
        for (const warning of parsedData.warnings) {
          await this.pool.query(
            `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
             VALUES ('CLASS', $1, $2, $3, $4, $5)`,
            [
              importRecord.id,
              warning.rowNumber || null,
              warning.code || 'UNKNOWN',
              warning.message || '',
              warning.rawValue || '',
            ],
          );
        }
      }

      return {
        importSession: importRecord,
        preview: parsedData.preview ?? parsedData.students ?? [],
        warnings: parsedData.warnings ?? [],
      };
    } catch (error: any) {
      await this.pool.query(
        `UPDATE class_imports SET import_status = 'FAILED', import_error = $1 WHERE id = $2`,
        [error.message || 'Unknown error', importRecord.id],
      );
      throw new BadRequestException(
        'Failed to process with pipeline server: ' + error.message,
      );
    }
  }

  async confirm(id: string): Promise<{ message: string }> {
    const importResult = await this.pool.query<ClassImportEntity>(
      `SELECT * FROM class_imports WHERE id = $1`,
      [id],
    );

    if (importResult.rowCount === 0) {
      throw new NotFoundException('class_imports not found');
    }

    const importRecord = importResult.rows[0];
    if (importRecord.import_status !== 'PENDING') {
      throw new BadRequestException('Import is not in PENDING state');
    }

    const rowsResult = await this.pool.query(
      `SELECT * FROM class_import_rows WHERE import_id = $1 AND row_status = 'PENDING'`,
      [id],
    );

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const row of rowsResult.rows) {
        // Upsert student
        await client.query(
          `INSERT INTO students (student_code, full_name, class_id)
           VALUES ($1, $2, $3)
           ON CONFLICT (student_code) 
           DO UPDATE SET 
             full_name = EXCLUDED.full_name,
             class_id = COALESCE(EXCLUDED.class_id, students.class_id),
             updated_at = CURRENT_TIMESTAMP`,
          [row.student_code, row.full_name, importRecord.class_id || null],
        );

        // Update row status
        await client.query(
          `UPDATE class_import_rows SET row_status = 'SUCCESS' WHERE id = $1`,
          [row.id],
        );
      }

      await client.query(
        `UPDATE class_imports SET import_status = 'SUCCESS', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id],
      );

      await client.query('COMMIT');
      return { message: 'Class imported successfully' };
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException(
        'Failed to confirm class import: ' + error.message,
      );
    } finally {
      client.release();
    }
  }

  private buildFilter(query: QueryClassImportsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.import_status) {
      clauses.push(`import_status = $${idx++}`);
      values.push(query.import_status);
    }
    if (query.class_id) {
      clauses.push(`class_id = $${idx++}`);
      values.push(query.class_id);
    }
    if (query.search) {
      clauses.push(`file_name ILIKE $${idx}`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(query: QueryClassImportsDto): Promise<ClassImportResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    values.push(limit, offset);

    const result = await this.pool.query<ClassImportEntity>(
      `SELECT * FROM class_imports ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return result.rows;
  }

  async pagination(
    query: QueryClassImportsDto,
  ): Promise<ClassImportsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM class_imports ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    values.push(limit, offset);

    const result = await this.pool.query<ClassImportEntity>(
      `SELECT * FROM class_imports ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: QueryClassImportsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM class_imports ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<ClassImportResponse> {
    const result = await this.pool.query<ClassImportEntity>(
      `SELECT * FROM class_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('class_imports not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<ClassImportResponse> {
    const keys = Object.keys(payload).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<ClassImportEntity>(
        `UPDATE class_imports SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('class_imports not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      handleDatabaseError(error, 'class_imports');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query(
      `DELETE FROM class_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('class_imports not found');
    }

    return { message: 'deleted' };
  }
}
