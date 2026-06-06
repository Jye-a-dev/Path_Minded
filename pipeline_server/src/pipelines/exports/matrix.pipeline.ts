import { Injectable, Logger } from '@nestjs/common';
import type {
  ExportStudent,
  ExportCourse,
  ExportCourseResult,
  MatrixData,
} from './exports.types';

/**
 * Builds the matrix data structure from raw records.
 */
@Injectable()
export class MatrixPipeline {
  private readonly logger = new Logger(MatrixPipeline.name);

  buildMatrix(
    students: ExportStudent[],
    courses: ExportCourse[],
    results: ExportCourseResult[],
  ): MatrixData {
    this.logger.log('Building export matrix');

    const pivotMap: Record<string, Record<string, string | number>> = {};
    for (const student of students) {
      pivotMap[student.id] = {};
    }

    for (const res of results) {
      if (!pivotMap[res.studentId]) continue;

      let val: string | number = '';
      if (res.status === 'PASSED') val = 'x';
      else if (res.status === 'FAILED') val = 'o';
      else if (res.status === 'STUDYING') val = res.semesterNumber || 'S';

      pivotMap[res.studentId][res.courseCode] = val;
    }

    let successCount = 0;
    let warningCount = 0;

    for (const course of courses) {
      let coursePassedCount = 0;
      for (const student of students) {
        const val = pivotMap[student.id][course.courseCode] || '';
        if (val === 'x') coursePassedCount++;
      }
      if (coursePassedCount === 0) warningCount++;
      else successCount++;
    }

    return {
      students,
      courses,
      results,
      pivotMap,
      stats: { successCount, warningCount },
    };
  }
}
