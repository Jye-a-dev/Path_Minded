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
   */
  parseText(rawText: string): ParsedLine[] {
    const normalizedText = rawText.normalize('NFC');
    const lines = normalizedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result: ParsedLine[] = [];
    let currentSemester: SemesterContext | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for "Bảo lưu" (Transferred / Exempted credits)
      if (/bảo\s*lưu/i.test(line)) {
        currentSemester = {
          semesterNumber: 0,
          schoolYear: 'Bảo lưu',
        };
        continue;
      }

      // Pattern 1: "Năm học: 2024-2025 - Học kỳ: HK01" or "Năm học: 2024-2025 - Học kỳ: 01"
      const matchA = line.match(
        /(?:năm\s*học|năm\s*học|school\s*year)\s*:\s*(\d{4}[-–]\d{4})\s*-\s*(?:học\s*kỳ|học\s*kỳ|semester)\s*:\s*(?:hk)?(\d+)/i,
      );
      if (matchA) {
        currentSemester = {
          semesterNumber: parseInt(matchA[2], 10),
          schoolYear: matchA[1],
        };
        continue;
      }

      // Pattern 2: "Học kỳ 1 - Năm học 2024-2025" or similar
      const matchB = line.match(
        /(?:học\s*kỳ|học\s*kỳ|semester)\s*(?:hk)?(\d+)\s*-\s*(?:năm\s*học|năm\s*học|school\s*year)\s*(\d{4}[-–]\d{4})/i,
      );
      if (matchB) {
        currentSemester = {
          semesterNumber: parseInt(matchB[1], 10),
          schoolYear: matchB[2],
        };
        continue;
      }

      // Columns split by tab
      const columns = line.split('\t').map((col) => col.trim());

      // A valid row must have at least 3 columns and the first column must be a sequence number (STT)
      if (columns.length >= 3 && /^\d+$/.test(columns[0])) {
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
