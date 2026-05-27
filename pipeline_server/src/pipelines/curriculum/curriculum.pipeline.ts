import { Injectable, Logger } from '@nestjs/common';
import { CurriculumParser } from './curriculum.parser';
import { CurriculumValidator } from './curriculum.validator';
import type {
  RawCurriculumInput,
  CurriculumParseResult,
  ParsedCurriculumCourse,
  CurriculumWarning,
} from './curriculum.types';

/**
 * Orchestrates the curriculum parsing pipeline.
 *
 * Flow:
 * file/text → parser (extract rows, map columns) → validator (detect duplicates, validate ranges) → result
 *
 * This class does NOT interact with the database.
 */
@Injectable()
export class CurriculumPipeline {
  private readonly logger = new Logger(CurriculumPipeline.name);

  constructor(
    private readonly parser: CurriculumParser,
    private readonly validator: CurriculumValidator,
  ) {}

  /**
   * Parse raw curriculum input and return validated course list.
   */
  async parse(input: RawCurriculumInput): Promise<CurriculumParseResult> {
    this.logger.log('Starting curriculum parse pipeline');

    let parsedResult: {
      courses: ParsedCurriculumCourse[];
      warnings: CurriculumWarning[];
      sheets?: string[];
      activeSheetIndex?: number;
    };

    if (input.fileBuffer) {
      parsedResult = await this.parser.parseExcel(
        input.fileBuffer,
        input.sheetIndex,
        input.columnMappings,
        input.courseTypeMappings,
      );
    } else if (input.textContent) {
      const rows = this.parser.parseText(input.textContent);
      parsedResult = this.parser.mapRows(rows);
    } else {
      return { preview: [], warnings: [], sheets: [], activeSheetIndex: 0 };
    }

    const {
      courses,
      warnings: parseWarnings,
      sheets = [],
      activeSheetIndex = 0,
    } = parsedResult;
    this.logger.log(`Parsed ${courses.length} courses from curriculum input`);

    // Validate parsed courses
    const validationWarnings = this.validator.validate(courses);

    return {
      preview: courses,
      warnings: [...parseWarnings, ...validationWarnings],
      sheets,
      activeSheetIndex,
    };
  }
}
