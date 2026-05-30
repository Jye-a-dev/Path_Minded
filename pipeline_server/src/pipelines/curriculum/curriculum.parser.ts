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
import { extractRowValues } from './parser/curriculum-parser.utils';
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
