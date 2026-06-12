import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class AlertEvaluationService {
  private readonly logger = new Logger(AlertEvaluationService.name);

  constructor(
    @Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool,
    private readonly syncService: SyncService,
  ) {}

  /**
   * Helper to check if a course is a non-credit or conditional course
   * (e.g. Physical Education, National Defense, Preparatory/Foundation English)
   */
  private isNonCreditOrConditional(course: {
    course_code: string;
    course_name: string | null;
    credits: number | null;
    course_type?: string | null;
  }): boolean {
    const credits = course.credits !== null ? Number(course.credits) : 0;
    if (credits === 0) {
      return true;
    }

    const type = course.course_type ? course.course_type.toUpperCase() : null;
    const name = course.course_name ? course.course_name.toLowerCase() : '';
    const code = course.course_code.toUpperCase();

    // 1. Check by explicit type
    if (type === 'PE' || type === 'DEFENSE') {
      return true;
    }
    if (type === 'ENGLISH' && (credits === 0 || /dự bị|tăng cường|foundation|preparatory/i.test(name))) {
      return true;
    }

    // 2. Semantic keywords fallbacks (VLU specifics)
    // Physical Education / Thể chất
    if (
      code.includes('GDTC') ||
      code.startsWith('PE') ||
      name.includes('thể chất') ||
      name.includes('thể dục') ||
      name.includes('giao duc the chat')
    ) {
      return true;
    }

    // National Defense / Giáo dục quốc phòng
    if (
      code.includes('GDQP') ||
      code.startsWith('MIL') ||
      name.includes('quốc phòng') ||
      name.includes('an ninh') ||
      name.includes('quân sự') ||
      name.includes('giao duc quoc phong')
    ) {
      return true;
    }

    // English Preparatory / Tiếng Anh tăng cường / dự bị
    const isEnglish = code.startsWith('ENG') || code.includes('ENG') || name.includes('anh văn') || name.includes('tiếng anh') || name.includes('english');
    const isPrep = /dự bị|tăng cường|foundation|preparatory/i.test(name);
    if (isEnglish && isPrep) {
      return true;
    }

    return false;
  }

  /**
   * Evaluates student's latest results and triggers warnings if thresholds are breached
   */
  async evaluateStudent(studentId: string): Promise<any> {
    this.logger.log(`Evaluating academic status for student: ${studentId}`);

    // 1. Fetch latest course results, joining with curriculum courses for type info
    const query = `
      SELECT r.*, c.course_type 
      FROM student_course_results r
      LEFT JOIN students s ON r.student_id = s.id
      LEFT JOIN curriculum_courses c ON s.program_id = c.program_id AND r.course_code = c.course_code
      WHERE r.student_id = $1 AND r.is_latest = true
    `;
    const resultsRes = await this.pool.query(query, [studentId]);
    const results = resultsRes.rows;

    let totalCredits = 0;
    let weightedScore4 = 0;
    let gpaCredits = 0;

    for (const row of results) {
      const isExcluded = this.isNonCreditOrConditional({
        course_code: row.course_code,
        course_name: row.course_name,
        credits: row.credits !== null ? Number(row.credits) : null,
        course_type: row.course_type,
      });

      if (isExcluded) {
        continue;
      }

      const credits = row.credits !== null ? Number(row.credits) : 0;
      if (row.status === 'PASSED') {
        totalCredits += credits;
      }

      if (row.score_4 !== null && credits > 0) {
        const score4 = Number(row.score_4);
        weightedScore4 += score4 * credits;
        gpaCredits += credits;
      }
    }

    const gpa = gpaCredits > 0 ? weightedScore4 / gpaCredits : 0;

    // 2. Fetch thresholds from system settings (if defined)
    const settingsRes = await this.pool.query(
      `SELECT key, value FROM system_settings WHERE key IN ('gpa_probation_threshold', 'gpa_warning_threshold')`,
    );
    let gpaProbationThreshold = 2.0;
    let gpaWarningThreshold = 2.2;

    settingsRes.rows.forEach((row) => {
      const val = parseFloat(row.value);
      if (!isNaN(val)) {
        if (row.key === 'gpa_probation_threshold') gpaProbationThreshold = val;
        if (row.key === 'gpa_warning_threshold') gpaWarningThreshold = val;
      }
    });

    // 3. Determine if alert is triggered
    let activeAlertType: 'PROBATION_RISK' | 'GPA_WARNING' | null = null;
    let description = '';

    if (gpaCredits > 0) {
      if (gpa < gpaProbationThreshold) {
        activeAlertType = 'PROBATION_RISK';
        description = `Cảnh báo buộc thôi học / đình chỉ do GPA tích lũy (${gpa.toFixed(2)}) dưới ngưỡng quy chế (${gpaProbationThreshold.toFixed(2)}).`;
      } else if (gpa < gpaWarningThreshold) {
        activeAlertType = 'GPA_WARNING';
        description = `Cảnh báo học vụ do GPA tích lũy (${gpa.toFixed(2)}) dưới mức an toàn (${gpaWarningThreshold.toFixed(2)}).`;
      }
    }

    // 4. Update database alerts inside a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Fetch any currently active alert
      const currentAlertRes = await client.query(
        `SELECT * FROM academic_alerts WHERE student_id = $1 AND alert_status = 'ACTIVE'`,
        [studentId],
      );
      const activeAlert = currentAlertRes.rows[0];

      if (activeAlertType) {
        if (activeAlert) {
          if (activeAlert.alert_type === activeAlertType) {
            // Update the existing alert parameters
            await client.query(
              `UPDATE academic_alerts 
               SET gpa = $1, total_credits = $2, description = $3, updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [gpa, totalCredits, description, activeAlert.id],
            );
          } else {
            // Resolve the old alert and insert the new level warning
            await client.query(
              `UPDATE academic_alerts 
               SET alert_status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP
               WHERE id = $1`,
              [activeAlert.id],
            );
            await client.query(
              `INSERT INTO academic_alerts (student_id, alert_type, alert_status, gpa, total_credits, description)
               VALUES ($1, $2, 'ACTIVE', $3, $4, $5)`,
              [studentId, activeAlertType, gpa, totalCredits, description],
            );
          }
        } else {
          // No active alert, insert new alert
          await client.query(
            `INSERT INTO academic_alerts (student_id, alert_type, alert_status, gpa, total_credits, description)
             VALUES ($1, $2, 'ACTIVE', $3, $4, $5)`,
            [studentId, activeAlertType, gpa, totalCredits, description],
          );
        }
      } else {
        // No alert triggered: resolve any active alert
        if (activeAlert) {
          await client.query(
            `UPDATE academic_alerts 
             SET alert_status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [activeAlert.id],
          );
        }
      }

      await client.query('COMMIT');
      
      // Push real-time sync update
      this.syncService.emitUpdate(studentId, 'alert_update');
    } catch (err) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to update alerts database records: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }

    return {
      studentId,
      gpa,
      totalCredits,
      activeAlert: activeAlertType,
      gpaCredits,
    };
  }
}
