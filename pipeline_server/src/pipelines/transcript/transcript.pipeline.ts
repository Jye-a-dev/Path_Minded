import { Injectable, Logger } from '@nestjs/common';
import { TranscriptParser } from './transcript.parser';
import { TranscriptMapper } from './transcript.mapper';
import type {
  RawTranscriptInput,
  TranscriptParseResult,
} from './transcript.types';

/**
 * Orchestrates the transcript parsing pipeline.
 *
 * Flow:
 * raw text/file → parser (split lines, detect semesters) → mapper (normalize, detect status) → structured results
 *
 * This class does NOT interact with the database.
 * It only transforms input data into structured output.
 */
@Injectable()
export class TranscriptPipeline {
  private readonly logger = new Logger(TranscriptPipeline.name);

  constructor(
    private readonly parser: TranscriptParser,
    private readonly mapper: TranscriptMapper,
  ) {}

  /**
   * Parse a raw transcript input and return structured course results.
   */
  parse(input: RawTranscriptInput): Promise<TranscriptParseResult> {
    this.logger.log('Starting transcript parse pipeline');

    let rawText: string;

    if (input.textContent) {
      rawText = input.textContent;
    } else if (input.fileBuffer) {
      // TODO: If file is PDF/image, implement OCR or text extraction here
      // For now, treat file buffer as plain text
      rawText = input.fileBuffer.toString('utf-8');
    } else {
      return Promise.resolve({ results: [], warnings: [] });
    }

    // Step 1: Parse raw text into structured lines
    const parsedLines = this.parser.parseText(rawText);
    this.logger.log(`Parsed ${parsedLines.length} lines from transcript`);

    // Step 2: Map parsed lines to course results
    const { results, warnings } = this.mapper.mapToResults(parsedLines);
    this.logger.log(
      `Mapped ${results.length} course results, ${warnings.length} warnings`,
    );

    return Promise.resolve({ results, warnings });
  }
}
