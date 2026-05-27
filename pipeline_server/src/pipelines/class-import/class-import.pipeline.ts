import { Injectable, Logger } from '@nestjs/common';
import { ClassImportParser } from './class-import.parser';
import type {
  RawClassImportInput,
  ClassImportParseResult,
} from './class-import.types';

/**
 * Orchestrates the class import parsing pipeline.
 * Does NOT interact with the database.
 */
@Injectable()
export class ClassImportPipeline {
  private readonly logger = new Logger(ClassImportPipeline.name);

  constructor(private readonly parser: ClassImportParser) {}

  async parse(input: RawClassImportInput): Promise<ClassImportParseResult> {
    this.logger.log('Starting class-import parse pipeline');

    let parsedResult: ClassImportParseResult;

    if (input.fileBuffer) {
      const parsed = await this.parser.parseExcel(input.fileBuffer);
      parsedResult = this.parser.mapRows(parsed, input.columnMappings);
    } else if (input.textContent) {
      const parsed = this.parser.parseText(
        input.textContent,
        input.columnMappings,
      );
      parsedResult = this.parser.mapRows(parsed, input.columnMappings);
    } else {
      return { students: [], warnings: [] };
    }

    this.logger.log(`Parsed ${parsedResult.students.length} students`);
    return parsedResult;
  }
}
