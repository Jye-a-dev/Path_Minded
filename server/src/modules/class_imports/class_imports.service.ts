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
    }>(
      "SELECT field_key, phrases FROM curriculum_column_mappings WHERE mapping_type = 'CLASS'",
    );
    const mappingConfig: Record<string, string[]> = {};
    mappingResult.rows.forEach((row) => {
      mappingConfig[row.field_key] = row.phrases;
    });

    const pipelineUrl =
      process.env.PIPELINE_SERVER_URL || 'http://localhost:5101';
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

  async confirm(
    id: string,
    payload?: {
      students?: {
        student_code: string;
        full_name: string;
        email: string | null;
      }[];
    },
  ): Promise<{ message: string }> {
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

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const studentsToImport = payload?.students;
      if (!studentsToImport || !Array.isArray(studentsToImport)) {
        throw new BadRequestException('students array is required');
      }

      // Fetch program_id and cohort_year of the class
      let programId: string | null = null;
      let cohortYear: number | null = null;
      if (importRecord.class_id) {
        const classResult = await client.query<{
          program_id: string | null;
          cohort_year: number | null;
        }>(`SELECT program_id, cohort_year FROM classes WHERE id = $1`, [
          importRecord.class_id,
        ]);
        if (classResult.rows.length > 0) {
          programId = classResult.rows[0].program_id;
          cohortYear = classResult.rows[0].cohort_year;
        }
      }

      for (const student of studentsToImport) {
        // Upsert student only — do NOT create user accounts during class import
        await client.query(
          `INSERT INTO students (student_code, full_name, class_id, program_id, cohort_year)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (student_code) 
           DO UPDATE SET 
             full_name = EXCLUDED.full_name,
             class_id = COALESCE(EXCLUDED.class_id, students.class_id),
             program_id = COALESCE(EXCLUDED.program_id, students.program_id),
             cohort_year = COALESCE(EXCLUDED.cohort_year, students.cohort_year),
             updated_at = CURRENT_TIMESTAMP`,
          [
            student.student_code,
            student.full_name,
            importRecord.class_id || null,
            programId,
            cohortYear,
          ],
        );
      }

      // Mark all pending rows for this import session as SUCCESS or FAILED based on whether they were imported
      const dbRowsResult = await this.pool.query<{
        id: string;
        student_code: string;
      }>(
        `SELECT id, student_code FROM class_import_rows WHERE import_id = $1 AND row_status = 'PENDING'`,
        [id],
      );

      const importedCodesSet = new Set(
        studentsToImport.map((s) => s.student_code),
      );

      for (const row of dbRowsResult.rows) {
        if (importedCodesSet.has(row.student_code)) {
          await client.query(
            `UPDATE class_import_rows SET row_status = 'SUCCESS' WHERE id = $1`,
            [row.id],
          );
        } else {
          await client.query(
            `UPDATE class_import_rows SET row_status = 'FAILED', row_error = 'Bỏ qua bởi người dùng' WHERE id = $1`,
            [row.id],
          );
        }
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
      clauses.push(`ci.import_status = $${idx++}`);
      values.push(query.import_status);
    }
    if (query.class_id) {
      clauses.push(`ci.class_id = $${idx++}`);
      values.push(query.class_id);
    }
    if (query.search) {
      clauses.push(`ci.file_name ILIKE $${idx}`);
      values.push(`%${query.search}%`);
      idx++;
    }
    if (query.program_id) {
      clauses.push(`c.program_id = $${idx++}`);
      values.push(query.program_id);
    }
    if (query.major_name) {
      clauses.push(`p.major_name = $${idx++}`);
      values.push(query.major_name);
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
      `SELECT ci.* FROM class_imports ci 
       LEFT JOIN classes c ON ci.class_id = c.id
       LEFT JOIN programs p ON c.program_id = p.id
       ${where} 
       ORDER BY ci.uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(ci.id) AS total FROM class_imports ci 
       LEFT JOIN classes c ON ci.class_id = c.id
       LEFT JOIN programs p ON c.program_id = p.id
       ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    values.push(limit, offset);

    const result = await this.pool.query<ClassImportEntity>(
      `SELECT ci.* FROM class_imports ci 
       LEFT JOIN classes c ON ci.class_id = c.id
       LEFT JOIN programs p ON c.program_id = p.id
       ${where} 
       ORDER BY ci.uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(ci.id) AS count FROM class_imports ci 
       LEFT JOIN classes c ON ci.class_id = c.id
       LEFT JOIN programs p ON c.program_id = p.id
       ${where}`,
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
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Delete associated students that were imported in this session
      await client.query(
        `DELETE FROM students 
         WHERE student_code IN (
           SELECT student_code FROM class_import_rows WHERE import_id = $1
         )`,
        [id],
      );

      // 2. Delete associated parse warnings
      await client.query(
        `DELETE FROM parse_warnings 
         WHERE source_type = 'CLASS' AND source_id = $1`,
        [id],
      );

      // 3. Delete the class import record (cascades to class_import_rows)
      const result = await client.query(
        `DELETE FROM class_imports WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('class_imports not found');
      }

      await client.query('COMMIT');
      return { message: 'deleted' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
