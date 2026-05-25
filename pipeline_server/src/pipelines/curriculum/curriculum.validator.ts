import { Injectable, Logger } from '@nestjs/common';
import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from './curriculum.types';

/**
 * Validates parsed curriculum courses.
 *
 * Responsibilities:
 * - Detect duplicate course codes
 * - Validate credit ranges
 * - Validate semester numbers
 * - Generate warnings for invalid data
 */
@Injectable()
export class CurriculumValidator {
  private readonly logger = new Logger(CurriculumValidator.name);

  validate(courses: ParsedCurriculumCourse[]): CurriculumWarning[] {
    const warnings: CurriculumWarning[] = [];

    // Detect duplicates
    const seen = new Map<string, number>();
    courses.forEach((course, idx) => {
      const existing = seen.get(course.courseCode);
      if (existing !== undefined) {
        warnings.push({
          rowNumber: idx + 1,
          code: 'DUPLICATE_COURSE',
          message: `Duplicate course code: ${course.courseCode} (first at row ${existing + 1})`,
          rawValue: course.courseCode,
        });
      } else {
        seen.set(course.courseCode, idx);
      }
    });

    // Validate data
    courses.forEach((course, idx) => {
      if (
        course.credits !== null &&
        (course.credits < 0 || course.credits > 20)
      ) {
        warnings.push({
          rowNumber: idx + 1,
          code: 'INVALID_CREDITS',
          message: `Unusual credit value: ${course.credits}`,
          rawValue: String(course.credits),
        });
      }

      if (
        course.expectedSemester !== null &&
        (course.expectedSemester < 1 || course.expectedSemester > 12)
      ) {
        warnings.push({
          rowNumber: idx + 1,
          code: 'INVALID_SEMESTER',
          message: `Unusual semester number: ${course.expectedSemester}`,
          rawValue: String(course.expectedSemester),
        });
      }
    });

    this.logger.log(`Validation complete: ${warnings.length} warnings`);
    return warnings;
  }
}
