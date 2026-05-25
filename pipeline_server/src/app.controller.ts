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
    @Body() body: any,
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
    @Body() body: any,
  ) {
    return this.curriculumPipeline.parse({
      fileBuffer: file?.buffer,
      textContent: body.textContent,
      fileName: file?.originalname,
    });
  }

  @Post('parse/class')
  @UseInterceptors(FileInterceptor('file'))
  async parseClass(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.classImportPipeline.parse({
      fileBuffer: file?.buffer,
      textContent: body.textContent,
      fileName: file?.originalname,
    });
  }

  @Post('exports/matrix')
  async exportMatrix(@Body() body: any) {
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
