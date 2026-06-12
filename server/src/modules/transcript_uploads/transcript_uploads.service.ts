/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
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
  TranscriptUploadsPaginationResponse,
  TranscriptUploadEntity,
  TranscriptUploadResponse,
} from './interfaces/transcript_uploads.interfaces';
import { handleDatabaseError } from '../../common/utils/database-error.util';
import { QueryTranscriptUploadsDto } from './dto/query-transcript-uploads.dto';
import { AlertEvaluationService } from '../alerts/alert-evaluation.service';

// Type definitions for parsing and merging results
interface ParsedCourseResult {
  courseCode: string;
  courseName?: string | null;
  credits?: number | null;
  schoolYear?: string | null;
  semesterCode?: string | null;
  semesterNumber?: number | null;
  score10?: number | null;
  score4?: number | null;
  letterGrade?: string | null;
  resultText?: string | null;
  status?: 'PASSED' | 'FAILED' | 'STUDYING';
  attemptNo?: number;
}

interface ParsedWarning {
  rowNumber?: number;
  code?: string;
  message?: string;
  rawValue?: string;
}

interface StudentCourseResultRow {
  id: string;
  student_id: string;
  upload_id: string;
  course_code: string;
  course_name: string | null;
  credits: number | null;
  school_year: string | null;
  semester_code: string | null;
  semester_number: number | null;
  score_10: string | number | null;
  score_4: string | number | null;
  letter_grade: string | null;
  result_text: string | null;
  status: 'PASSED' | 'FAILED' | 'STUDYING';
  attempt_no: number;
  is_latest: boolean;
}

interface AttemptItem {
  id?: string;
  student_id: string;
  upload_id: string;
  course_code: string;
  course_name: string | null;
  credits: number | null;
  school_year: string | null;
  semester_code: string | null;
  semester_number: number | null;
  score_10: number | null;
  score_4: number | null;
  letter_grade: string | null;
  result_text: string | null;
  status: 'PASSED' | 'FAILED' | 'STUDYING';
  attempt_no: number;
  is_latest: boolean;
  isExisting?: boolean;
  isNew?: boolean;
  isUpdated?: boolean;
}

@Injectable()
export class TranscriptUploadsService implements OnModuleInit {
  constructor(
    @Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool,
    private readonly alertEvaluationService: AlertEvaluationService,
  ) {}

  async onModuleInit() {
    await this.pool.query(
      `ALTER TABLE transcript_uploads ADD COLUMN IF NOT EXISTS parsed_json JSONB;`,
    );
  }

  async create(
    payload: Record<string, unknown>,
    file?: Express.Multer.File,
  ): Promise<any> {
    let studentId = (payload.studentId || payload.student_id) as string;
    const sourceType = payload.sourceType as string;
    const studentCode = payload.studentCode as string;

    if (!studentId && studentCode) {
      const studentRes = await this.pool.query(
        `SELECT id FROM students WHERE student_code = $1`,
        [studentCode],
      );
      if (studentRes.rows.length > 0) {
        studentId = studentRes.rows[0].id as string;
      }
    }

    if (!studentId) {
      throw new BadRequestException(
        'Không tìm thấy sinh viên tương ứng. Vui lòng cung cấp studentId hoặc student_code hợp lệ.',
      );
    }

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
      process.env.PIPELINE_SERVER_URL || 'http://localhost:3100';
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

        // Fetch all existing course results for this student
        const existingRes = await client.query(
          `SELECT * FROM student_course_results WHERE student_id = $1`,
          [studentId],
        );
        const existingList = existingRes.rows as StudentCourseResultRow[];

        // Build a map of attempts by course_code
        const attemptsByCourse = new Map<string, AttemptItem[]>();

        for (const item of existingList) {
          const code = item.course_code;
          if (!attemptsByCourse.has(code)) {
            attemptsByCourse.set(code, []);
          }
          const attempts = attemptsByCourse.get(code) || [];
          attempts.push({
            id: item.id,
            student_id: item.student_id,
            upload_id: item.upload_id,
            course_code: item.course_code,
            course_name: item.course_name,
            credits: item.credits,
            school_year: item.school_year,
            semester_code: item.semester_code,
            semester_number: item.semester_number,
            score_10: item.score_10 !== null ? Number(item.score_10) : null,
            score_4: item.score_4 !== null ? Number(item.score_4) : null,
            letter_grade: item.letter_grade,
            result_text: item.result_text,
            status: item.status,
            attempt_no: item.attempt_no,
            is_latest: item.is_latest,
            isExisting: true,
          });
        }

        const parsedResults = (parsedData.results ||
          []) as ParsedCourseResult[];
        const parsedWarnings = (parsedData.warnings || []) as ParsedWarning[];

        if (parsedResults.length > 0) {
          for (const res of parsedResults) {
            const code = res.courseCode;
            if (!attemptsByCourse.has(code)) {
              attemptsByCourse.set(code, []);
            }

            const attempts = attemptsByCourse.get(code) || [];

            // Check if there is already an attempt in the same semester
            const sameSemesterAttempt = attempts.find(
              (a: AttemptItem) =>
                (a.school_year === res.schoolYear ||
                  (!a.school_year && !res.schoolYear)) &&
                (a.semester_code === res.semesterCode ||
                  (!a.semester_code && !res.semesterCode)),
            );

            if (sameSemesterAttempt) {
              // Merge: Update the existing attempt with the new parsed data (since new upload is newer)
              sameSemesterAttempt.upload_id = uploadRecord.id;
              sameSemesterAttempt.course_name =
                res.courseName || sameSemesterAttempt.course_name;
              sameSemesterAttempt.credits =
                res.credits !== undefined
                  ? res.credits
                  : sameSemesterAttempt.credits;
              sameSemesterAttempt.score_10 =
                res.score10 !== undefined
                  ? res.score10 !== null
                    ? Number(res.score10)
                    : null
                  : sameSemesterAttempt.score_10;
              sameSemesterAttempt.score_4 =
                res.score4 !== undefined
                  ? res.score4 !== null
                    ? Number(res.score4)
                    : null
                  : sameSemesterAttempt.score_4;
              sameSemesterAttempt.letter_grade =
                res.letterGrade !== undefined
                  ? res.letterGrade
                  : sameSemesterAttempt.letter_grade;
              sameSemesterAttempt.result_text =
                res.resultText !== undefined
                  ? res.resultText
                  : sameSemesterAttempt.result_text;
              sameSemesterAttempt.status =
                res.status || sameSemesterAttempt.status;
              sameSemesterAttempt.semester_number =
                res.semesterNumber !== undefined
                  ? res.semesterNumber
                  : sameSemesterAttempt.semester_number;
              sameSemesterAttempt.isUpdated = true;
            } else {
              // Add as a new attempt
              attempts.push({
                student_id: studentId,
                upload_id: uploadRecord.id,
                course_code: res.courseCode,
                course_name: res.courseName || null,
                credits: res.credits || null,
                school_year: res.schoolYear || null,
                semester_code: res.semesterCode || null,
                semester_number: res.semesterNumber || null,
                score_10: res.score10 !== null ? Number(res.score10) : null,
                score_4: res.score4 !== null ? Number(res.score4) : null,
                letter_grade: res.letterGrade || null,
                result_text: res.resultText || null,
                status: res.status || 'STUDYING',
                attempt_no: 1,
                is_latest: true,
                isNew: true,
              });
            }
          }
        }

        // Process each course code's attempts (re-index attempt numbers and determine the latest/best attempt)
        for (const attempts of attemptsByCourse.values()) {
          // Sort attempts chronologically
          attempts.sort((a, b) => {
            const valA = this.getSemesterSortValue(
              a.school_year,
              a.semester_number,
            );
            const valB = this.getSemesterSortValue(
              b.school_year,
              b.semester_number,
            );
            return valA - valB;
          });

          // Re-assign attempt_no
          attempts.forEach((a, index) => {
            const newAttemptNo = index + 1;
            if (a.attempt_no !== newAttemptNo) {
              a.attempt_no = newAttemptNo;
              a.isUpdated = true;
            }
          });

          // Find best attempt
          let bestAttemptIndex = 0;
          for (let i = 1; i < attempts.length; i++) {
            if (
              this.compareAttempts(attempts[i], attempts[bestAttemptIndex]) > 0
            ) {
              bestAttemptIndex = i;
            }
          }

          // Mark is_latest
          attempts.forEach((a, index) => {
            const isLatest = index === bestAttemptIndex;
            if (a.is_latest !== isLatest) {
              a.is_latest = isLatest;
              a.isUpdated = true;
            }
          });

          // Database operations (INSERT or UPDATE)
          for (const a of attempts) {
            if (a.isNew) {
              await client.query(
                `INSERT INTO student_course_results 
                 (student_id, upload_id, course_code, course_name, credits, school_year, semester_code, semester_number, score_10, score_4, letter_grade, result_text, status, attempt_no, is_latest)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [
                  a.student_id,
                  a.upload_id,
                  a.course_code,
                  a.course_name,
                  a.credits,
                  a.school_year,
                  a.semester_code,
                  a.semester_number,
                  a.score_10,
                  a.score_4,
                  a.letter_grade,
                  a.result_text,
                  a.status,
                  a.attempt_no,
                  a.is_latest,
                ],
              );
            } else if (a.isUpdated) {
              await client.query(
                `UPDATE student_course_results 
                 SET upload_id = $1, course_name = $2, credits = $3, score_10 = $4, score_4 = $5, letter_grade = $6, result_text = $7, status = $8, attempt_no = $9, is_latest = $10
                 WHERE id = $11`,
                [
                  a.upload_id,
                  a.course_name,
                  a.credits,
                  a.score_10,
                  a.score_4,
                  a.letter_grade,
                  a.result_text,
                  a.status,
                  a.attempt_no,
                  a.is_latest,
                  a.id,
                ],
              );
            }
          }
        }

        if (parsedWarnings.length > 0) {
          for (const warning of parsedWarnings) {
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
          `UPDATE transcript_uploads SET parse_status = 'SUCCESS', parsed_at = CURRENT_TIMESTAMP, parsed_json = $1 WHERE id = $2`,
          [JSON.stringify(parsedData), uploadRecord.id],
        );

        await client.query('COMMIT');

        // Evaluate student's academic warning status after successful transcript processing
        try {
          await this.alertEvaluationService.evaluateStudent(studentId);
        } catch (evalError) {
          // Log evaluation error but do not fail the transcript upload operation
          console.error(`Alert evaluation failed for student ${studentId}:`, evalError);
        }

        return {
          uploadSession: uploadRecord,
          results: parsedResults,
          warnings: parsedWarnings,
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
      clauses.push(`tu.parse_status = $${idx++}`);
      values.push(query.parse_status);
    }
    if (query.student_id) {
      clauses.push(`tu.student_id = $${idx++}`);
      values.push(query.student_id);
    }
    if (query.search) {
      clauses.push(
        `(tu.raw_text ILIKE $${idx} OR s.student_code ILIKE $${idx} OR s.full_name ILIKE $${idx})`,
      );
      values.push(`%${query.search}%`);
      idx++;
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
      `SELECT tu.*, s.student_code, s.full_name 
       FROM transcript_uploads tu
       LEFT JOIN students s ON tu.student_id = s.id
       ${where} 
       ORDER BY tu.uploaded_at DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(*) AS total 
       FROM transcript_uploads tu
       LEFT JOIN students s ON tu.student_id = s.id
       ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    values.push(limit, offset);

    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT tu.*, s.student_code, s.full_name 
       FROM transcript_uploads tu
       LEFT JOIN students s ON tu.student_id = s.id
       ${where} 
       ORDER BY tu.uploaded_at DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
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
      `SELECT COUNT(*) AS count 
       FROM transcript_uploads tu
       LEFT JOIN students s ON tu.student_id = s.id
       ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<TranscriptUploadResponse> {
    const result = await this.pool.query<TranscriptUploadEntity>(
      `SELECT tu.*, s.student_code, s.full_name 
       FROM transcript_uploads tu
       LEFT JOIN students s ON tu.student_id = s.id
       WHERE tu.id = $1`,
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
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete matching student course results
      await client.query(
        `DELETE FROM student_course_results WHERE upload_id = $1`,
        [id],
      );

      // Delete associated parse warnings
      await client.query(
        `DELETE FROM parse_warnings WHERE source_id = $1 AND source_type = 'TRANSCRIPT'`,
        [id],
      );

      const result = await client.query(
        `DELETE FROM transcript_uploads WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('transcript_uploads not found');
      }

      await client.query('COMMIT');
      return { message: 'deleted' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private getSemesterSortValue(
    schoolYear: string | null,
    semesterNumber: number | null,
  ): number {
    let yearVal = 0;
    if (schoolYear) {
      const match = schoolYear.match(/^(\d{4})/);
      if (match) {
        yearVal = parseInt(match[1], 10);
      }
    }
    const semVal = semesterNumber ? Number(semesterNumber) : 0;
    return yearVal * 10 + semVal;
  }

  private getAttemptScore(status: string): number {
    if (status === 'PASSED') return 3;
    if (status === 'STUDYING') return 2;
    return 1; // FAILED
  }

  private compareAttempts(a: AttemptItem, b: AttemptItem): number {
    const scoreA = this.getAttemptScore(a.status);
    const scoreB = this.getAttemptScore(b.status);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    const gradeA =
      a.score_10 !== null
        ? Number(a.score_10)
        : a.score_4 !== null
          ? Number(a.score_4) * 2.5
          : null;
    const gradeB =
      b.score_10 !== null
        ? Number(b.score_10)
        : b.score_4 !== null
          ? Number(b.score_4) * 2.5
          : null;

    if (gradeA !== null && gradeB !== null) {
      if (gradeA !== gradeB) {
        return gradeA - gradeB;
      }
    } else if (gradeA !== null) {
      return 1;
    } else if (gradeB !== null) {
      return -1;
    }

    const sortA = this.getSemesterSortValue(a.school_year, a.semester_number);
    const sortB = this.getSemesterSortValue(b.school_year, b.semester_number);
    return sortA - sortB;
  }
}
