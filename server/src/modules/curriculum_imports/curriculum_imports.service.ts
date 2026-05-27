/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  CurriculumImportsPaginationResponse,
  CurriculumImportEntity,
  CurriculumImportResponse,
} from './interfaces/curriculum_imports.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryCurriculumImportsDto } from './dto/query-curriculum-imports.dto';

@Injectable()
export class CurriculumImportsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
    file?: Express.Multer.File,
  ): Promise<any> {
    const programId = payload.programId as string;
    const advisorId = payload.advisorId as string;

    const fileName = file ? file.originalname : 'Pasted Text';
    const fileBuffer = file ? file.buffer : null;

    // Insert into DB as PENDING with binary file data stored directly in Postgres
    const insertResult = await this.pool.query<CurriculumImportEntity>(
      `INSERT INTO curriculum_imports (advisor_id, program_id, file_name, file_path, file_data, import_status) 
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [advisorId || null, programId || null, fileName, null, fileBuffer],
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
      const response = await fetch(`${pipelineUrl}/parse/curriculum`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pipeline error: ${response.statusText}`);
      }
      const parsedData = (await response.json()) as {
        preview?: any[];
        warnings?: any[];
        sheets?: string[];
        activeSheetIndex?: number;
      };

      // Save warnings to parse_warnings if any
      if (parsedData.warnings && parsedData.warnings.length > 0) {
        for (const warning of parsedData.warnings) {
          await this.pool.query(
            `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
             VALUES ('CURRICULUM', $1, $2, $3, $4, $5)`,
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
        preview: parsedData.preview ?? [],
        warnings: parsedData.warnings ?? [],
        sheets: parsedData.sheets ?? [],
        activeSheetIndex: parsedData.activeSheetIndex ?? 0,
      };
    } catch (error: any) {
      // Update status to FAILED
      await this.pool.query(
        `UPDATE curriculum_imports SET import_status = 'FAILED', import_error = $1 WHERE id = $2`,
        [error.message || 'Unknown error', importRecord.id],
      );
      throw new BadRequestException(
        'Failed to process with pipeline server: ' + error.message,
      );
    }
  }

  async reparse(id: string, payload: Record<string, unknown>): Promise<any> {
    const sheetIndex =
      payload.sheetIndex !== undefined ? Number(payload.sheetIndex) : 0;

    // 1. Fetch import session
    const importResult = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (importResult.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    const importRecord = importResult.rows[0];
    if (importRecord.import_status !== 'PENDING') {
      throw new BadRequestException('Import is not in PENDING state');
    }

    // Fetch binary file data from the database
    const fileBuffer = importRecord.file_data;
    if (!fileBuffer) {
      throw new BadRequestException(
        'No Excel file data found for this session in the database',
      );
    }

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

    const blob = new Blob([new Uint8Array(fileBuffer)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    formData.append('file', blob, importRecord.file_name);
    formData.append('sheetIndex', String(sheetIndex));

    try {
      const response = await fetch(`${pipelineUrl}/parse/curriculum`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pipeline error: ${response.statusText}`);
      }
      const parsedData = (await response.json()) as {
        preview?: any[];
        warnings?: any[];
        sheets?: string[];
        activeSheetIndex?: number;
      };

      // Update warnings in database (clear old warnings for this session first)
      await this.pool.query(
        `DELETE FROM parse_warnings WHERE source_type = 'CURRICULUM' AND source_id = $1`,
        [id],
      );

      if (parsedData.warnings && parsedData.warnings.length > 0) {
        for (const warning of parsedData.warnings) {
          await this.pool.query(
            `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
             VALUES ('CURRICULUM', $1, $2, $3, $4, $5)`,
            [
              id,
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
        preview: parsedData.preview ?? [],
        warnings: parsedData.warnings ?? [],
        sheets: parsedData.sheets ?? [],
        activeSheetIndex: parsedData.activeSheetIndex ?? 0,
      };
    } catch (error: any) {
      throw new BadRequestException(
        'Failed to reparse with pipeline server: ' + error.message,
      );
    }
  }

  async confirm(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<{ message: string }> {
    // 1. Fetch import session
    const importResult = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (importResult.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    const importRecord = importResult.rows[0];
    if (importRecord.import_status !== 'PENDING') {
      throw new BadRequestException('Import is not in PENDING state');
    }

    const courses = payload.courses as Array<any>;
    if (!courses || !Array.isArray(courses)) {
      throw new BadRequestException('courses array is required in payload');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const course of courses) {
        await client.query(
          `INSERT INTO curriculum_courses (
             program_id, import_id, course_code, course_name, credits, expected_semester, course_group, course_type, is_required,
             theory_hours, practice_hours, project_hours, internship_hours, prerequisite, corequisite, organizing_semester
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (program_id, course_code) 
           DO UPDATE SET 
             course_name = EXCLUDED.course_name,
             credits = EXCLUDED.credits,
             expected_semester = EXCLUDED.expected_semester,
             course_group = EXCLUDED.course_group,
             course_type = EXCLUDED.course_type,
             is_required = EXCLUDED.is_required,
             theory_hours = EXCLUDED.theory_hours,
             practice_hours = EXCLUDED.practice_hours,
             project_hours = EXCLUDED.project_hours,
             internship_hours = EXCLUDED.internship_hours,
             prerequisite = EXCLUDED.prerequisite,
             corequisite = EXCLUDED.corequisite,
             organizing_semester = EXCLUDED.organizing_semester,
             updated_at = CURRENT_TIMESTAMP`,
          [
            importRecord.program_id,
            id,
            course.courseCode,
            course.courseName,
            course.credits || null,
            course.expectedSemester || null,
            course.courseGroup || null,
            course.courseType || 'REQUIRED',
            course.isRequired !== undefined ? course.isRequired : true,
            course.theoryHours != null ? Number(course.theoryHours) : null,
            course.practiceHours != null ? Number(course.practiceHours) : null,
            course.projectHours != null ? Number(course.projectHours) : null,
            course.internshipHours != null
              ? Number(course.internshipHours)
              : null,
            course.prerequisite || null,
            course.corequisite || null,
            course.organizingSemester || null,
          ],
        );
      }

      // Update status to SUCCESS
      await client.query(
        `UPDATE curriculum_imports SET import_status = 'SUCCESS', processed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id],
      );

      await client.query('COMMIT');
      return { message: 'Curriculum imported successfully' };
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw new BadRequestException(
        'Failed to confirm curriculum import: ' + error.message,
      );
    } finally {
      client.release();
    }
  }

  private buildFilter(query: QueryCurriculumImportsDto): {
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
    if (query.program_id) {
      clauses.push(`program_id = $${idx++}`);
      values.push(query.program_id);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(
    query: QueryCurriculumImportsDto,
  ): Promise<CurriculumImportResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    values.push(limit, offset);

    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return result.rows;
  }

  async pagination(
    query: QueryCurriculumImportsDto,
  ): Promise<CurriculumImportsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM curriculum_imports ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    values.push(limit, offset);

    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: QueryCurriculumImportsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM curriculum_imports ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<CurriculumImportResponse> {
    const result = await this.pool.query<CurriculumImportEntity>(
      `SELECT * FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CurriculumImportResponse> {
    const keys = Object.keys(payload).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CurriculumImportEntity>(
        `UPDATE curriculum_imports SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('curriculum_imports not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      handleDatabaseError(error, 'curriculum_imports');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    // Cascade delete any curriculum courses that were created from this import session
    await this.pool.query(
      `DELETE FROM curriculum_courses WHERE import_id = $1`,
      [id],
    );

    const result = await this.pool.query(
      `DELETE FROM curriculum_imports WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('curriculum_imports not found');
    }

    return { message: 'deleted' };
  }
}
