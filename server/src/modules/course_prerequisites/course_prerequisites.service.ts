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
  CoursePrerequisitesPaginationResponse,
  CoursePrerequisiteEntity,
  CoursePrerequisiteResponse,
} from './interfaces/course_prerequisites.interfaces';
import { parsePrerequisites } from '../curriculum_imports/curriculum_imports.helper';

@Injectable()
export class CoursePrerequisitesService {
  constructor(@Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool) {}

  private async validatePrerequisiteCycle(
    programId: string,
    courseCode: string,
    prerequisiteCourseCode: string,
  ): Promise<void> {
    if (courseCode === prerequisiteCourseCode) {
      throw new BadRequestException(
        'Môn học không thể tự là điều kiện tiên quyết của chính nó.',
      );
    }

    // 1. Fetch all existing prerequisites for this program
    const res = await this.pool.query<{
      course_code: string;
      prerequisite_course_code: string;
    }>(
      `SELECT course_code, prerequisite_course_code FROM course_prerequisites WHERE program_id = $1`,
      [programId],
    );
    const edges = res.rows;

    // 2. Build graph (prerequisite -> course)
    const adjList: Record<string, string[]> = {};
    const allNodes = new Set<string>();

    edges.forEach((edge) => {
      const parent = edge.prerequisite_course_code;
      const child = edge.course_code;
      if (!adjList[parent]) adjList[parent] = [];
      adjList[parent].push(child);
      allNodes.add(parent);
      allNodes.add(child);
    });

    // Add proposed edge
    if (!adjList[prerequisiteCourseCode]) {
      adjList[prerequisiteCourseCode] = [];
    }
    adjList[prerequisiteCourseCode].push(courseCode);
    allNodes.add(prerequisiteCourseCode);
    allNodes.add(courseCode);

    // 3. DFS colors: 0 = white, 1 = gray, 2 = black
    const visited: Record<string, number> = {};
    allNodes.forEach((node) => (visited[node] = 0));

    const hasCycle = (node: string): boolean => {
      visited[node] = 1;

      const neighbors = adjList[node] || [];
      for (const neighbor of neighbors) {
        if (visited[neighbor] === 1) {
          return true; // Cycle detected
        }
        if (visited[neighbor] === 0) {
          if (hasCycle(neighbor)) return true;
        }
      }

      visited[node] = 2;
      return false;
    };

    let cycleFound = false;
    for (const node of allNodes) {
      if (visited[node] === 0) {
        if (hasCycle(node)) {
          cycleFound = true;
          break;
        }
      }
    }

    if (cycleFound) {
      const errMsg = `Phát hiện vòng lặp môn tiên quyết: Thêm "${prerequisiteCourseCode}" làm tiên quyết cho "${courseCode}" tạo chu trình khép kín.`;

      try {
        await this.pool.query(
          `INSERT INTO parse_warnings (source_type, source_id, warning_code, warning_message, raw_value)
           VALUES ('PREREQUISITE', $1, 'CIRCULAR_DEPENDENCY', $2, $3)`,
          [programId, errMsg, `${prerequisiteCourseCode} -> ${courseCode}`],
        );
      } catch (logErr) {
        console.error('Failed to log circular dependency warning:', logErr);
      }

      throw new BadRequestException(errMsg);
    }
  }

  async create(
    payload: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('payload is required');
    }

    const programId = (payload.program_id || payload.programId) as string;
    const courseCode = (payload.course_code || payload.courseCode) as string;
    const prereqCode = (payload.prerequisite_course_code ||
      payload.prerequisiteCourseCode) as string;
    if (programId && courseCode && prereqCode) {
      await this.validatePrerequisiteCycle(programId, courseCode, prereqCode);
    }

    const cols = keys.join(', ');
    const params = keys.map((_, i) => '$' + (i + 1)).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CoursePrerequisiteEntity>(
        `INSERT INTO course_prerequisites (${cols}) VALUES (${params}) RETURNING *`,
        values,
      );
      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('duplicate key');
      }
      if (code === '23503') {
        throw new BadRequestException('invalid foreign key');
      }
      throw error;
    }
  }

  private buildFilter(query: Record<string, unknown>): {
    where: string;
    values: Array<string | number | boolean>;
    idx: number;
  } {
    const clauses: string[] = [];
    const values: Array<string | number | boolean> = [];
    let idx = 1;

    Object.entries(query).forEach(([key, value]) => {
      if (
        value === undefined ||
        key === 'page' ||
        key === 'limit' ||
        key === 'offset'
      ) {
        return;
      }

      if (key === 'search') {
        clauses.push(
          `(cp.course_code ILIKE $${idx} OR cp.prerequisite_course_code ILIKE $${idx})`,
        );
        values.push(`%${value as string}%`);
        idx++;
        return;
      }

      clauses.push(`cp.${key} = $${idx++}`);
      values.push(value as string | number | boolean);
    });

    return {
      where: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      values,
      idx,
    };
  }

  async findAll(
    query: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse[]> {
    const { where, values, idx } = this.buildFilter(query);
    const limit = Number(query.limit ?? 20);
    const offset = Number(query.offset ?? 0);

    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT cp.*, 
              c1.course_name AS course_name, 
              c2.course_name AS prerequisite_course_name
       FROM course_prerequisites cp
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c1 ON cp.program_id = c1.program_id AND cp.course_code = c1.course_code
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c2 ON cp.program_id = c2.program_id AND cp.prerequisite_course_code = c2.course_code
       ${where} 
       ORDER BY cp.id DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  async pagination(
    query: Record<string, unknown>,
  ): Promise<CoursePrerequisitesPaginationResponse> {
    const { where, values, idx } = this.buildFilter(query);
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const offset = (page - 1) * limit;

    const countResult = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM course_prerequisites cp ${where}`,
      values,
    );

    const total = Number(countResult.rows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT cp.*, 
              c1.course_name AS course_name, 
              c2.course_name AS prerequisite_course_name
       FROM course_prerequisites cp
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c1 ON cp.program_id = c1.program_id AND cp.course_code = c1.course_code
       LEFT JOIN (
         SELECT DISTINCT ON (program_id, course_code) program_id, course_code, course_name 
         FROM curriculum_courses
       ) c2 ON cp.program_id = c2.program_id AND cp.prerequisite_course_code = c2.course_code
       ${where} 
       ORDER BY cp.id DESC 
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset],
    );

    return {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    };
  }

  async count(query: Record<string, unknown>): Promise<{ count: number }> {
    const { where, values } = this.buildFilter(query);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM course_prerequisites cp ${where}`,
      values,
    );

    return { count: Number(result.rows[0]?.count ?? 0) };
  }

  async findOne(id: string): Promise<CoursePrerequisiteResponse> {
    const result = await this.pool.query<CoursePrerequisiteEntity>(
      `SELECT * FROM course_prerequisites WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('course_prerequisites not found');
    }

    return result.rows[0];
  }

  async update(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse> {
    const keys = Object.keys(payload);
    if (keys.length === 0) {
      throw new BadRequestException('at least one field is required');
    }

    const existing = await this.findOne(id);
    const programId = (payload.program_id ||
      payload.programId ||
      existing.program_id) as string;
    const courseCode = (payload.course_code ||
      payload.courseCode ||
      existing.course_code) as string;
    const prereqCode = (payload.prerequisite_course_code ||
      payload.prerequisiteCourseCode ||
      existing.prerequisite_course_code) as string;
    if (programId && courseCode && prereqCode) {
      await this.validatePrerequisiteCycle(programId, courseCode, prereqCode);
    }

    const sets = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = keys.map((key) => payload[key] ?? null);

    try {
      const result = await this.pool.query<CoursePrerequisiteEntity>(
        `UPDATE course_prerequisites SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id],
      );

      if (result.rowCount === 0) {
        throw new NotFoundException('course_prerequisites not found');
      }

      return result.rows[0];
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === '23505') {
        throw new ConflictException('duplicate key');
      }
      if (code === '23503') {
        throw new BadRequestException('invalid foreign key');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.pool.query(
      `DELETE FROM course_prerequisites WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('course_prerequisites not found');
    }

    return { message: 'deleted' };
  }

  async syncFromCurriculum(programId: string): Promise<{ count: number }> {
    if (!programId) {
      throw new BadRequestException('program_id is required');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Delete all existing prerequisites for this program
      await client.query(
        `DELETE FROM course_prerequisites WHERE program_id = $1`,
        [programId],
      );

      // 2. Fetch all curriculum courses for this program
      const coursesResult = await client.query<{
        course_code: string;
        prerequisite: string | null;
        corequisite: string | null;
      }>(
        `SELECT course_code, prerequisite, corequisite 
         FROM curriculum_courses 
         WHERE program_id = $1`,
        [programId],
      );

      const courses = coursesResult.rows;
      if (courses.length === 0) {
        await client.query('COMMIT');
        return { count: 0 };
      }

      // 3. Parse and build prerequisite collections
      const programIds: string[] = [];
      const courseCodes: string[] = [];
      const prereqCodes: string[] = [];
      const prereqTypes: string[] = [];

      for (const course of courses) {
        const courseCode = course.course_code;

        // Parse prerequisite -> REQUIRED
        if (course.prerequisite) {
          const prereqs = parsePrerequisites(course.prerequisite);
          for (const prereqCode of prereqs) {
            if (prereqCode === courseCode) continue;
            programIds.push(programId);
            courseCodes.push(courseCode);
            prereqCodes.push(prereqCode);
            prereqTypes.push('REQUIRED');
          }
        }

        // Parse corequisite -> PREVIOUS
        if (course.corequisite) {
          const coreqs = parsePrerequisites(course.corequisite);
          for (const coreqCode of coreqs) {
            if (coreqCode === courseCode) continue;
            programIds.push(programId);
            courseCodes.push(courseCode);
            prereqCodes.push(coreqCode);
            prereqTypes.push('PREVIOUS');
          }
        }
      }

      let insertedCount = 0;
      if (programIds.length > 0) {
        const result = await client.query(
          `INSERT INTO course_prerequisites (program_id, course_code, prerequisite_course_code, prerequisite_type)
           SELECT UNNEST($1::uuid[]), UNNEST($2::text[]), UNNEST($3::text[]), UNNEST($4::text[])
           ON CONFLICT (program_id, course_code, prerequisite_course_code) 
           DO UPDATE SET prerequisite_type = EXCLUDED.prerequisite_type
           RETURNING id`,
          [programIds, courseCodes, prereqCodes, prereqTypes],
        );
        insertedCount = result.rowCount ?? 0;
      }

      await client.query('COMMIT');
      return { count: insertedCount };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
