import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type {
  ParsedCurriculumCourse,
  CurriculumWarning,
} from './curriculum.types';
import {
  TableHeaders,
  TableState,
  RawRow,
} from './parser/curriculum-parser.types';
import {
  extractRowValues,
  getCellString,
} from './parser/curriculum-parser.utils';
import { detectHeaders } from './header.detector';
import { parseTableCourse } from './parser/table-course.parser';
import * as textCourseParser from './parser/text-course.parser';

@Injectable()
export class CurriculumParser {
  private readonly logger = new Logger(CurriculumParser.name);

  async parseExcel(
    buffer: Buffer,
    targetSheetIdx?: number,
    columnMappings?: Record<string, string[]>,
    courseTypeMappings?: Record<string, string[]>,
  ): Promise<{
    courses: ParsedCurriculumCourse[];
    warnings: CurriculumWarning[];
    sheets: string[];
    activeSheetIndex: number;
    headersDetected?: boolean;
    rawHeaders?: string[];
    potentialHeaderRow?: number;
  }> {
    const wb = new Workbook();
    await wb.xlsx.load(buffer);

    const courses: ParsedCurriculumCourse[] = [];
    const warnings: CurriculumWarning[] = [];

    const sheets = wb.worksheets
      .filter((w) => w !== undefined && w !== null)
      .map((w) => w.name || 'Sheet');
    const activeSheetIndex = Math.min(
      targetSheetIdx ?? 0,
      Math.max(0, sheets.length - 1),
    );
    const ws = wb.worksheets[activeSheetIndex];

    if (ws) {
      let currentHeaderConfig: {
        t1: TableHeaders;
        t2: TableHeaders | null;
      } | null = null;

      // Check if standard headers are found
      let headersFound = false;
      ws.eachRow((row) => {
        if (headersFound) return;
        const vals = extractRowValues(row);
        if (detectHeaders(vals, columnMappings)) {
          headersFound = true;
        }
      });

      if (!headersFound) {
        let maxStringCount = 0;
        let rawHeaders: string[] = [];
        let potentialHeaderRow = -1;
        ws.eachRow((row, rowNumber) => {
          if (rowNumber > 25) return;
          const vals = extractRowValues(row);
          const stringVals = vals
            .map((v) => getCellString(v).trim())
            .filter(Boolean);
          if (stringVals.length > maxStringCount) {
            const numberCount = vals.filter(
              (v) =>
                typeof v === 'number' ||
                (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''),
            ).length;
            if (numberCount < stringVals.length * 0.5) {
              maxStringCount = stringVals.length;
              rawHeaders = vals.map((v) => getCellString(v).trim());
              potentialHeaderRow = rowNumber;
            }
          }
        });
        return {
          courses: [],
          warnings: [],
          sheets,
          activeSheetIndex,
          headersDetected: false,
          rawHeaders,
          potentialHeaderRow,
        };
      }

      const context = {
        t1: {
          semester: null,
          organizingSemester: null,
          courseGroup: null,
          knowledgeBlock: null,
        } as TableState,
        t2: {
          semester: null,
          organizingSemester: null,
          courseGroup: null,
          knowledgeBlock: null,
        } as TableState,
      };

      ws.eachRow((row, rowNumber) => {
        const vals = extractRowValues(row);

        if (vals.length === 0 || vals.every((v) => v === null || v === ''))
          return;

        const detected = detectHeaders(vals, columnMappings);
        if (detected) {
          currentHeaderConfig = detected;
          return;
        }

        if (!currentHeaderConfig) return;

        const c1 = parseTableCourse(
          vals,
          currentHeaderConfig.t1,
          false,
          context.t1,
          rowNumber,
          warnings,
          courseTypeMappings,
        );
        if (c1) courses.push(c1);

        const c2 = parseTableCourse(
          vals,
          currentHeaderConfig.t2,
          true,
          context.t2,
          rowNumber,
          warnings,
          courseTypeMappings,
        );
        if (c2) courses.push(c2);
      });
    }

    return { courses, warnings, sheets, activeSheetIndex };
  }

  parseText(text: string): RawRow[] {
    return textCourseParser.parseText(text);
  }

  mapRows(rows: RawRow[]): {
    courses: ParsedCurriculumCourse[];
    warnings: CurriculumWarning[];
  } {
    return textCourseParser.mapRows(rows);
  }
}
