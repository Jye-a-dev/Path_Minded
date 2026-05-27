import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptPipeline } from './pipelines/transcript/transcript.pipeline';
import { CurriculumPipeline } from './pipelines/curriculum/curriculum.pipeline';
import { ClassImportPipeline } from './pipelines/class-import/class-import.pipeline';
import { MatrixPipeline } from './pipelines/exports/matrix.pipeline';
import { ExcelBuilder } from './pipelines/exports/excel.builder';
import type {
  ExportStudent,
  ExportCourse,
  ExportCourseResult,
} from './pipelines/exports/exports.types';

interface ParseBody {
  textContent?: string;
}

interface ExportMatrixBody {
  students: ExportStudent[];
  courses: ExportCourse[];
  results: ExportCourseResult[];
}

@Controller()
export class AppController {
  constructor(
    private readonly transcriptPipeline: TranscriptPipeline,
    private readonly curriculumPipeline: CurriculumPipeline,
    private readonly classImportPipeline: ClassImportPipeline,
    private readonly matrixPipeline: MatrixPipeline,
    private readonly excelBuilder: ExcelBuilder,
  ) {}

  @Post('parse/transcript')
  @UseInterceptors(FileInterceptor('file'))
  async parseTranscript(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ParseBody,
  ) {
    return this.transcriptPipeline.parse({
      fileBuffer: file?.buffer,
      textContent: body.textContent,
      fileName: file?.originalname,
    });
  }

  @Post('parse/curriculum')
  @UseInterceptors(FileInterceptor('file'))
  async parseCurriculum(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { textContent?: string; sheetIndex?: string | number },
  ) {
    const sheetIdx =
      body.sheetIndex !== undefined ? Number(body.sheetIndex) : 0;
    return this.curriculumPipeline.parse({
      fileBuffer: file?.buffer,
      textContent: body.textContent,
      fileName: file?.originalname,
      sheetIndex: sheetIdx,
    });
  }

  @Post('parse/class')
  @UseInterceptors(FileInterceptor('file'))
  async parseClass(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ParseBody,
  ) {
    return this.classImportPipeline.parse({
      fileBuffer: file?.buffer,
      textContent: body.textContent,
      fileName: file?.originalname,
    });
  }

  @Post('exports/matrix')
  async exportMatrix(@Body() body: ExportMatrixBody) {
    const { students, courses, results } = body;
    const matrixData = this.matrixPipeline.buildMatrix(
      students,
      courses,
      results,
    );
    const buffer = await this.excelBuilder.buildMatrixExcel(matrixData);
    return {
      buffer: buffer.toString('base64'),
      successCount: matrixData.stats.successCount,
      warningCount: matrixData.stats.warningCount,
    };
  }
}
