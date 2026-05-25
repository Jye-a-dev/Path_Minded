import { Module } from '@nestjs/common';
import { TranscriptParser } from './transcript/transcript.parser';
import { TranscriptMapper } from './transcript/transcript.mapper';
import { TranscriptPipeline } from './transcript/transcript.pipeline';

import { CurriculumParser } from './curriculum/curriculum.parser';
import { CurriculumValidator } from './curriculum/curriculum.validator';
import { CurriculumPipeline } from './curriculum/curriculum.pipeline';

import { ClassImportParser } from './class-import/class-import.parser';
import { ClassImportPipeline } from './class-import/class-import.pipeline';

import { MatrixPipeline } from './exports/matrix.pipeline';
import { ExcelBuilder } from './exports/excel.builder';

@Module({
  providers: [
    TranscriptParser,
    TranscriptMapper,
    TranscriptPipeline,

    CurriculumParser,
    CurriculumValidator,
    CurriculumPipeline,

    ClassImportParser,
    ClassImportPipeline,

    MatrixPipeline,
    ExcelBuilder,
  ],
  exports: [
    TranscriptPipeline,
    CurriculumPipeline,
    ClassImportPipeline,
    MatrixPipeline,
    ExcelBuilder,
  ],
})
export class PipelinesModule {}
