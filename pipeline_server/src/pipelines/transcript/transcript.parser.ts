import { Injectable } from '@nestjs/common';

/**
 * Parses raw transcript text into structured lines and detects semesters.
 *
 * Responsibilities:
 * - Split raw text into lines
 * - Detect semester headers (e.g. "Học kỳ 1 - Năm học 2023-2024")
 * - Detect course rows vs non-course rows
 * - Return structured raw rows with semester context
 */
@Injectable()
export class TranscriptParser {
  /**
   * Parse raw transcript text into lines with semester context.
   * TODO: Implement actual parsing logic based on your transcript format.
   */
  parseText(rawText: string): ParsedLine[] {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result: ParsedLine[] = [];
    let currentSemester: SemesterContext | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // TODO: Adjust semester detection regex to match your transcript format
      const semesterMatch = line.match(
        /[Hh]ọc\s*[Kk]ỳ\s*(\d+).*?(\d{4}[-–]\d{4})/,
      );
      if (semesterMatch) {
        currentSemester = {
          semesterNumber: parseInt(semesterMatch[1], 10),
          schoolYear: semesterMatch[2],
        };
        continue;
      }

      // TODO: Adjust course row detection to match your transcript format
      // Example: tab-separated or pipe-separated columns
      const columns = line.split('\t').map((col) => col.trim());
      if (columns.length >= 3) {
        result.push({
          lineNumber: i + 1,
          rawLine: line,
          columns,
          semester: currentSemester,
        });
      }
    }

    return result;
  }
}

export type SemesterContext = {
  semesterNumber: number;
  schoolYear: string;
};

export type ParsedLine = {
  lineNumber: number;
  rawLine: string;
  columns: string[];
  semester: SemesterContext | null;
};
