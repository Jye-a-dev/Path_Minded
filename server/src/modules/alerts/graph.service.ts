import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';

export interface BottleneckCourseRow {
  course_code: string;
  course_name: string;
  credits: number | null;
  expected_semester: number | null;
  course_type: string | null;
  out_degree: string | number;
}

export interface BottleneckCourse {
  course_code: string;
  course_name: string;
  credits: number | null;
  expected_semester: number | null;
  course_type: string | null;
  out_degree: number;
}

export interface PrerequisiteRow {
  course_code: string;
  prerequisite_course_code: string;
  prerequisite_type?: string;
}

export interface CurriculumCourseRow {
  course_code: string;
  course_name: string;
  credits: number | null;
  expected_semester: number | null;
  course_type: string | null;
}

export interface AlertRow {
  id: string;
  student_id: string;
  alert_type: string;
  alert_status: string;
  description: string;
}

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  /**
   * Identifies bottleneck courses in a program based on their out-degree in the prerequisites graph.
   */
  async getBottleneckCourses(programId: string): Promise<BottleneckCourse[]> {
    this.logger.log(`Scanning bottleneck courses for program: ${programId}`);
    const query = `
      SELECT cc.course_code, cc.course_name, cc.credits, cc.expected_semester, cc.course_type,
             COALESCE(sub.out_degree, 0) AS out_degree
      FROM curriculum_courses cc
      LEFT JOIN (
          SELECT prerequisite_course_code, COUNT(*) AS out_degree
          FROM course_prerequisites
          WHERE program_id = $1 AND prerequisite_type NOT IN ('RECOMMENDED')
          GROUP BY prerequisite_course_code
      ) sub ON cc.course_code = sub.prerequisite_course_code
      WHERE cc.program_id = $1
      ORDER BY out_degree DESC, cc.course_code ASC
    `;
    const result = await this.pool.query<BottleneckCourseRow>(query, [
      programId,
    ]);
    return result.rows.map((row) => ({
      ...row,
      out_degree: parseInt(row.out_degree.toString(), 10),
    }));
  }

  /**
   * Simulates the delay propagation when a student fails a course.
   * Uses BFS to trace downstream dependencies and calculate semester delay.
   */
  async simulateDelay(
    studentId: string,
    failedCourseCode: string,
  ): Promise<any> {
    this.logger.log(
      `Simulating prerequisite delay for student: ${studentId}, failed course: ${failedCourseCode}`,
    );

    // 1. Fetch student info
    const studentRes = await this.pool.query<{
      program_id: string;
      full_name: string;
    }>(`SELECT program_id, full_name FROM students WHERE id = $1`, [studentId]);
    if (studentRes.rows.length === 0) {
      throw new Error('Student not found');
    }
    const { program_id: programId, full_name: studentName } =
      studentRes.rows[0];

    // 2. Fetch all prerequisites for this program
    const prereqRes = await this.pool.query<PrerequisiteRow>(
      `SELECT course_code, prerequisite_course_code, prerequisite_type FROM course_prerequisites WHERE program_id = $1`,
      [programId],
    );
    const prereqs = prereqRes.rows;

    // 3. Build adjacency list of dependencies: prerequisite -> course (A -> B)
    const adjList: Record<string, string[]> = {};
    prereqs.forEach((row) => {
      const parent = row.prerequisite_course_code;
      const child = row.course_code;
      const type = row.prerequisite_type || 'REQUIRED';
      // RECOMMENDED prerequisites do not propagate delay warnings
      if (type === 'RECOMMENDED') {
        return;
      }
      if (!adjList[parent]) adjList[parent] = [];
      adjList[parent].push(child);
    });

    // 4. Fetch all passed courses for this student
    const passedRes = await this.pool.query<{ course_code: string }>(
      `SELECT course_code FROM student_course_results WHERE student_id = $1 AND status = 'PASSED' AND is_latest = true`,
      [studentId],
    );
    const passedSet = new Set<string>(
      passedRes.rows.map((row) => row.course_code),
    );

    // 5. Run BFS to compute delay propagation
    const delays: Record<string, number> = {};
    delays[failedCourseCode] = 1; // Direct delay of 1 semester

    const queue: string[] = [failedCourseCode];
    const affectedCourses: {
      course_code: string;
      course_name: string;
      delay: number;
    }[] = [];
    let maxDelay = 1;

    // Get course names map
    const courseNamesRes = await this.pool.query<{
      course_code: string;
      course_name: string;
    }>(
      `SELECT course_code, course_name FROM curriculum_courses WHERE program_id = $1`,
      [programId],
    );
    const namesMap = new Map<string, string>();
    courseNamesRes.rows.forEach((row) =>
      namesMap.set(row.course_code, row.course_name),
    );

    while (queue.length > 0) {
      const u = queue.shift()!;
      const uDelay = delays[u];

      const children = adjList[u] || [];
      for (const v of children) {
        if (passedSet.has(v)) continue;

        const vDelay = uDelay + 1;
        if (!delays[v] || vDelay > delays[v]) {
          delays[v] = vDelay;
          if (vDelay > maxDelay) {
            maxDelay = vDelay;
          }
          const idx = affectedCourses.findIndex((c) => c.course_code === v);
          const courseDetail = {
            course_code: v,
            course_name: namesMap.get(v) || 'Môn học chưa rõ',
            delay: vDelay,
          };
          if (idx !== -1) {
            affectedCourses[idx] = courseDetail;
          } else {
            affectedCourses.push(courseDetail);
          }
          queue.push(v);
        }
      }
    }

    // 6. Generate warning description if bottleneck delay is triggered
    let isWarningTriggered = false;
    let description = '';

    // Sort affected courses by delay descending
    affectedCourses.sort((a, b) => b.delay - a.delay);

    if (affectedCourses.length > 0 && maxDelay >= 2) {
      isWarningTriggered = true;
      description = `Cảnh báo trễ tiến độ: Việc trượt môn học nút thắt "${
        namesMap.get(failedCourseCode) || failedCourseCode
      }" có thể làm chậm tiến độ tốt nghiệp tối đa ${maxDelay} học kỳ và ảnh hưởng trực tiếp đến ${
        affectedCourses.length
      } môn học tiếp theo.`;

      // Update or create alert in database
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // Resolve other warnings of the same bottleneck type if any
        await client.query(
          `UPDATE academic_alerts 
           SET alert_status = 'RESOLVED', updated_at = CURRENT_TIMESTAMP
           WHERE student_id = $1 AND alert_type = 'CREDIT_WARNING' AND alert_status = 'ACTIVE'`,
          [studentId],
        );

        // Check if there is an active warning for this failed course
        const existingAlert = await client.query<{ id: string }>(
          `SELECT id FROM academic_alerts WHERE student_id = $1 AND alert_type = 'CREDIT_WARNING' AND alert_status = 'ACTIVE'`,
          [studentId],
        );

        if (existingAlert.rows.length === 0) {
          await client.query(
            `INSERT INTO academic_alerts (student_id, alert_type, alert_status, description, total_credits)
             VALUES ($1, 'CREDIT_WARNING', 'ACTIVE', $2, $3)`,
            [studentId, description, affectedCourses.length],
          );
        } else {
          await client.query(
            `UPDATE academic_alerts 
             SET description = $1, total_credits = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [description, affectedCourses.length, existingAlert.rows[0].id],
          );
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Failed to commit simulate delay alerts: ${message}`);
      } finally {
        client.release();
      }
    }

    return {
      studentId,
      studentName,
      failedCourseCode,
      failedCourseName: namesMap.get(failedCourseCode) || failedCourseCode,
      maxDelaySemesters: maxDelay,
      affectedCount: affectedCourses.length,
      affectedCourses,
      isWarningTriggered,
      description,
    };
  }

  /**
   * Recommends a list of priority courses for the next semester using a Topological Sort (Kahn's algorithm)
   * on all unpassed courses.
   */
  async suggestNextCourses(
    studentId: string,
    limitCredits = 18,
  ): Promise<any[]> {
    this.logger.log(
      `Generating semester course planner suggestions for student: ${studentId}`,
    );

    // 1. Fetch student's program id
    const studentRes = await this.pool.query<{ program_id: string }>(
      `SELECT program_id FROM students WHERE id = $1`,
      [studentId],
    );
    if (studentRes.rows.length === 0) {
      throw new Error('Student not found');
    }
    const programId = studentRes.rows[0].program_id;

    // 2. Fetch all courses in the curriculum
    const coursesRes = await this.pool.query<CurriculumCourseRow>(
      `SELECT course_code, course_name, credits, expected_semester, course_type
       FROM curriculum_courses 
       WHERE program_id = $1`,
      [programId],
    );
    const curriculum = coursesRes.rows;

    // 3. Fetch all passed courses for this student
    const passedRes = await this.pool.query<{ course_code: string }>(
      `SELECT course_code FROM student_course_results WHERE student_id = $1 AND status = 'PASSED' AND is_latest = true`,
      [studentId],
    );
    const passedSet = new Set<string>(
      passedRes.rows.map((row) => row.course_code),
    );

    // 4. Fetch all prerequisites
    const prereqRes = await this.pool.query<PrerequisiteRow>(
      `SELECT course_code, prerequisite_course_code, prerequisite_type FROM course_prerequisites WHERE program_id = $1`,
      [programId],
    );
    const prereqs = prereqRes.rows;

    // Fetch all completed/taken courses for the student (PASSED or FAILED)
    const takenRes = await this.pool.query<{ course_code: string }>(
      `SELECT course_code FROM student_course_results WHERE student_id = $1 AND status IN ('PASSED', 'FAILED') AND is_latest = true`,
      [studentId],
    );
    const takenSet = new Set<string>(
      takenRes.rows.map((row) => row.course_code),
    );

    // 5. Get out-degrees for bottleneck weighting
    const bottlenecks = await this.getBottleneckCourses(programId);
    const outDegrees = new Map<string, number>();
    bottlenecks.forEach((c) => outDegrees.set(c.course_code, c.out_degree));

    // 6. Build Dependency maps for unpassed courses
    const inDegree: Record<string, number> = {};
    const adjList: Record<string, string[]> = {};
    const unpassedList = curriculum.filter(
      (c) => !passedSet.has(c.course_code),
    );
    const unpassedCodes = new Set<string>(
      unpassedList.map((c) => c.course_code),
    );

    unpassedList.forEach((c) => {
      inDegree[c.course_code] = 0;
      adjList[c.course_code] = [];
    });

    prereqs.forEach((row) => {
      const parent = row.prerequisite_course_code;
      const child = row.course_code;
      const type = row.prerequisite_type || 'REQUIRED';

      // RECOMMENDED prerequisites never block suggested course topological sort
      if (type === 'RECOMMENDED') {
        return;
      }

      // PREVIOUS prerequisites only block if the student hasn't taken the parent course
      if (type === 'PREVIOUS') {
        if (unpassedCodes.has(child) && !takenSet.has(parent)) {
          if (unpassedCodes.has(parent)) {
            adjList[parent].push(child);
            inDegree[child] = (inDegree[child] || 0) + 1;
          }
        }
        return;
      }

      // REQUIRED (or other default types): block if parent is not passed
      if (unpassedCodes.has(parent) && unpassedCodes.has(child)) {
        adjList[parent].push(child);
        inDegree[child] = (inDegree[child] || 0) + 1;
      }
    });

    // 7. Find courses that have 0 in-degree (i.e. all prerequisites are already passed)
    const availableCourses = unpassedList.filter(
      (c) => (inDegree[c.course_code] || 0) === 0,
    );

    // 8. Prioritize available courses:
    // - Prioritize older expected semesters (backlog clearance)
    // - Prioritize higher out-degree (bottleneck removal)
    availableCourses.sort((a, b) => {
      const semA = a.expected_semester || 99;
      const semB = b.expected_semester || 99;
      if (semA !== semB) {
        return semA - semB;
      }
      const outA = outDegrees.get(a.course_code) || 0;
      const outB = outDegrees.get(b.course_code) || 0;
      return outB - outA;
    });

    // 9. Accumulate courses until credit limit is hit
    const recommendedList: any[] = [];
    let accumulatedCredits = 0;

    for (const course of availableCourses) {
      const credits = course.credits !== null ? Number(course.credits) : 0;
      if (accumulatedCredits + credits <= limitCredits) {
        recommendedList.push({
          ...course,
          out_degree: outDegrees.get(course.course_code) || 0,
        });
        accumulatedCredits += credits;
      }
    }

    return recommendedList;
  }

  /**
   * Fetches the active academic warning (if any) for a student
   */
  async getActiveAlert(studentId: string): Promise<AlertRow | null> {
    const res = await this.pool.query<AlertRow>(
      `SELECT id, student_id, alert_type, alert_status, description FROM academic_alerts WHERE student_id = $1 AND alert_status = 'ACTIVE' LIMIT 1`,
      [studentId],
    );
    return res.rows[0] || null;
  }

  /**
   * Updates the status of an academic alert (e.g. from ACTIVE to RESOLVED)
   */
  async updateAlertStatus(alertId: string, status: string): Promise<AlertRow> {
    const res = await this.pool.query<AlertRow>(
      `UPDATE academic_alerts 
       SET alert_status = $1::alert_status, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, student_id, alert_type, alert_status, description`,
      [status, alertId],
    );
    if (res.rowCount === 0) {
      throw new Error('Alert not found');
    }
    return res.rows[0];
  }

  /**
   * Get all alerts for a student
   */
  async getStudentAlerts(studentId: string): Promise<AlertRow[]> {
    const res = await this.pool.query<AlertRow>(
      `SELECT id, student_id, alert_type, alert_status, gpa, total_credits, description, created_at, updated_at 
       FROM academic_alerts 
       WHERE student_id = $1 
       ORDER BY created_at DESC`,
      [studentId],
    );
    return res.rows;
  }

  /**
   * Create academic alert
   */
  async createAlert(payload: {
    studentId: string;
    alertType: 'PROBATION_RISK' | 'GPA_WARNING' | 'CREDIT_WARNING';
    alertStatus?: 'ACTIVE' | 'RESOLVED';
    description?: string;
    gpa?: number | null;
    totalCredits?: number | null;
  }): Promise<AlertRow> {
    const status = payload.alertStatus || 'ACTIVE';
    const res = await this.pool.query<AlertRow>(
      `INSERT INTO academic_alerts (student_id, alert_type, alert_status, description, gpa, total_credits)
       VALUES ($1, $2::alert_type, $3::alert_status, $4, $5, $6)
       RETURNING id, student_id, alert_type, alert_status, gpa, total_credits, description, created_at, updated_at`,
      [
        payload.studentId,
        payload.alertType,
        status,
        payload.description || '',
        payload.gpa ?? null,
        payload.totalCredits ?? null,
      ],
    );
    return res.rows[0];
  }

  /**
   * Update academic alert
   */
  async updateAlert(
    id: string,
    payload: {
      alertType: 'PROBATION_RISK' | 'GPA_WARNING' | 'CREDIT_WARNING';
      alertStatus: 'ACTIVE' | 'RESOLVED';
      description?: string;
      gpa?: number | null;
      totalCredits?: number | null;
    },
  ): Promise<AlertRow> {
    const res = await this.pool.query<AlertRow>(
      `UPDATE academic_alerts 
       SET alert_type = $1::alert_type, alert_status = $2::alert_status, description = $3, gpa = $4, total_credits = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, student_id, alert_type, alert_status, gpa, total_credits, description, created_at, updated_at`,
      [
        payload.alertType,
        payload.alertStatus,
        payload.description || '',
        payload.gpa ?? null,
        payload.totalCredits ?? null,
        id,
      ],
    );
    if (res.rowCount === 0) {
      throw new Error('Alert not found');
    }
    return res.rows[0];
  }

  /**
   * Delete academic alert
   */
  async deleteAlert(id: string): Promise<AlertRow> {
    const res = await this.pool.query<AlertRow>(
      `DELETE FROM academic_alerts WHERE id = $1 RETURNING student_id`,
      [id],
    );
    if (res.rowCount === 0) {
      throw new Error('Alert not found');
    }
    return res.rows[0];
  }
}
