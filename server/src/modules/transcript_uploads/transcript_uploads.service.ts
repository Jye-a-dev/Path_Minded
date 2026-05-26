/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import {
  TranscriptUploadsPaginationResponse,
  TranscriptUploadEntity,
  TranscriptUploadResponse,
} from './interfaces/transcript_uploads.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryTranscriptUploadsDto } from './dto/query-transcript-uploads.dto';

@Injectable()
export class TranscriptUploadsService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  async create(
    payload: Record<string, unknown>,
    file?: Express.Multer.File,
  ): Promise<any> {
    const studentId = payload.studentId as string;
    const sourceType = payload.sourceType as string;
    const rawText = payload.textContent
      ? (payload.textContent as string)
      : file
        ? 'FILE UPLOADED'
        : '';

    const insertResult = await this.pool.query<TranscriptUploadEntity>(
      `INSERT INTO transcript_uploads (student_id, raw_text, source_type, parse_status) 
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      [studentId, rawText, sourceType === 'file' ? 'FILE' : 'PASTE'],
    );
    const uploadRecord = insertResult.rows[0];

    const pipelineUrl =
      process.env.PIPELINE_SERVER_URL || 'http://localhost:5100';
    const formData = new FormData();
    if (studentId) formData.append('studentId', studentId);

    if (file) {
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
      });
      formData.append('file', blob, file.originalname);
    } else if (payload.textContent) {
      formData.append('textContent', payload.textContent as string);
    }

    try {
      const response = await fetch(`${pipelineUrl}/parse/transcript`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Pipeline error: ${response.statusText}`);
      }
      const parsedData = await response.json();

      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Save results
        if (parsedData.results && parsedData.results.length > 0) {
          for (const res of parsedData.results) {
            await client.query(
              `INSERT INTO student_course_results 
               (student_id, upload_id, course_code, course_name, credits, school_year, semester_code, semester_number, score_10, score_4, letter_grade, result_text, status, attempt_no)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
              [
                studentId,
                uploadRecord.id,
                res.courseCode,
                res.courseName || null,
                res.credits || null,
                res.schoolYear || null,
                res.semesterCode || null,
                res.semesterNumber || null,
                res.score10 || null,
                res.score4 || null,
                res.letterGrade || null,
                res.resultText || null,
                res.status || 'STUDYING',
                res.attemptNo || 1,
              ],
            );
          }
        }

        if (parsedData.warnings && parsedData.warnings.length > 0) {
          for (const warning of parsedData.warnings) {
            await client.query(
              `INSERT INTO parse_warnings (source_type, source_id, row_number, warning_code, warning_message, raw_value)
               VALUES ('TRANSCRIPT', $1, $2, $3, $4, $5)`,
              [
                uploadRecord.id,
                warning.rowNumber || null,
                warning.code || 'UNKNOWN',
                warning.message || '',
                warning.rawValue || '',
              ],
            );
          }
        }

        await client.query(
          `UPDATE transcript_uploads SET parse_status = 'SUCCESS', parsed_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [uploadRecord.id],
        );

        await client.query('COMMIT');

        return {
          uploadSession: uploadRecord,
          results: parsedData.results || [],
          warnings: parsedData.warnings || [],
        };
      } catch (dbError: any) {
        await client.query('ROLLBACK');
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error: any) {
      await this.pool.query(
        `UPDATE transcript_uploads SET parse_status = 'FAILED', parse_error = $1 WHERE id = $2`,
        [error.message || 'Unknown error', uploadRecord.id],
      );
      throw new BadRequestException(
        'Failed to process with pipeline server: ' + error.message,
      );
    }
  }

  private buildFilter(query: QueryTranscriptUploadsDto): {
    where: string;
    values: Array<string | number>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number> = [];
    let idx = 1;

    if (query.parse_status) {
      clauses.push(`parse_status = $${idx++}`);
      values.push(query.parse_status);
    }
    if (query.student_id) {
      clauses.push(`student_id = $${idx++}`);
      values.push(query.student_id);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, values, idx };
  }

  async findAll(
    query: QueryTranscriptUploadsDto,
  ): Promise<TranscriptUploadResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);
    values.push(limit, offset);

    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return result.rows;
  }

  async pagination(
    query: QueryTranscriptUploadsDto,
  ): Promise<TranscriptUploadsPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM transcript_uploads ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    values.push(limit, offset);

    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads ${where} ORDER BY uploaded_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      values,
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: QueryTranscriptUploadsDto): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM transcript_uploads ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<TranscriptUploadResponse> {
    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT * FROM transcript_uploads WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('transcript_uploads not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<TranscriptUploadResponse> {
    const keys = Object.keys(payload).filter((k) => k !== 'id');
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<TranscriptUploadEntity>(
        `UPDATE transcript_uploads SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('transcript_uploads not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      handleDatabaseError(error, 'transcript_uploads');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query(
      `DELETE FROM transcript_uploads WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('transcript_uploads not found');
    }

    return { message: 'deleted' };
  }
}
