import { Injectable } from '@nestjs/common';
import type { ParsedLine } from './transcript.parser';
import type { ParsedCourseResult, TranscriptWarning } from './transcript.types';

/**
 * Maps parsed transcript lines into structured course results.
 *
 * Responsibilities:
 * - Normalize course_code format
 * - Detect passed/failed/studying status
 * - Extract scores (score_10, score_4, letter_grade)
 * - Generate warnings for ambiguous/invalid rows
 */
@Injectable()
export class TranscriptMapper {
  /**
   * Map parsed lines to structured course results.
   * TODO: Implement column mapping based on your transcript format.
   */
  mapToResults(lines: ParsedLine[]): {
    results: ParsedCourseResult[];
    warnings: TranscriptWarning[];
  } {
    const results: ParsedCourseResult[] = [];
    const warnings: TranscriptWarning[] = [];

    for (const line of lines) {
      try {
        const result = this.mapLine(line);
        if (result) {
          results.push(result);
        }
      } catch {
        warnings.push({
          rowNumber: line.lineNumber,
          code: 'PARSE_ERROR',
          message: `Failed to parse line: ${line.rawLine}`,
          rawValue: line.rawLine,
        });
      }
    }

    return { results, warnings };
  }

  /**
   * Map a single parsed line to a course result.
   * TODO: Adjust column indices to match your transcript format.
   *
   * Expected columns (example):
   * [0] = course_code
   * [1] = course_name
   * [2] = credits
   * [3] = score_10
   * [4] = score_4
   * [5] = letter_grade
   * [6] = result_text (e.g. "Đạt", "Không đạt")
   */
  private mapLine(line: ParsedLine): ParsedCourseResult | null {
    const cols = line.columns;
    if (cols.length < 3) return null;

    const courseCode = this.normalizeCourseCode(cols[0]);
    if (!courseCode) return null;

    const score10 = this.parseScore(cols[3]);
    const score4 = this.parseScore(cols[4]);
    const letterGrade = cols[5]?.trim() || null;
    const resultText = cols[6]?.trim() || null;

    return {
      courseCode,
      courseName: cols[1]?.trim() || null,
      credits: this.parseInteger(cols[2]),
      schoolYear: line.semester?.schoolYear || null,
      semesterCode: line.semester
        ? `${line.semester.schoolYear}_HK${line.semester.semesterNumber}`
        : null,
      semesterNumber: line.semester?.semesterNumber || null,
      score10,
      score4,
      letterGrade,
      resultText,
      status: this.detectStatus(score10, score4, letterGrade, resultText),
      attemptNo: 1,
    };
  }

  /**
   * Normalize course code: trim, uppercase, remove extra whitespace.
   */
  private normalizeCourseCode(raw: string | undefined): string {
    if (!raw) return '';
    return raw.trim().toUpperCase().replace(/\s+/g, '');
  }

  /**
   * Detect course status based on scores and result text.
   * TODO: Adjust rules to match your grading system.
   */
  private detectStatus(
    score10: number | null,
    score4: number | null,
    letterGrade: string | null,
    resultText: string | null,
  ): 'PASSED' | 'FAILED' | 'STUDYING' {
    // Check result text first
    if (resultText) {
      const lower = resultText.toLowerCase();
      if (lower.includes('đạt') && !lower.includes('không')) return 'PASSED';
      if (lower.includes('không đạt') || lower.includes('rớt')) return 'FAILED';
      if (lower.includes('đang học') || lower.includes('chưa'))
        return 'STUDYING';
    }

    // Check letter grade
    if (letterGrade) {
      const upper = letterGrade.toUpperCase();
      if (['A', 'A+', 'B', 'B+', 'C', 'C+', 'D', 'D+'].includes(upper))
        return 'PASSED';
      if (upper === 'F') return 'FAILED';
    }

    // Check numeric scores
    if (score10 !== null) {
      return score10 >= 4.0 ? 'PASSED' : 'FAILED';
    }
    if (score4 !== null) {
      return score4 >= 1.0 ? 'PASSED' : 'FAILED';
    }

    return 'STUDYING';
  }

  private parseScore(raw: string | undefined): number | null {
    if (!raw) return null;
    const num = parseFloat(raw.trim().replace(',', '.'));
    return Number.isFinite(num) ? num : null;
  }

  private parseInteger(raw: string | undefined): number | null {
    if (!raw) return null;
    const num = parseInt(raw.trim(), 10);
    return Number.isFinite(num) ? num : null;
  }
}
