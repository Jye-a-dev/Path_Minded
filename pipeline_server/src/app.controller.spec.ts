import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { TranscriptPipeline } from './pipelines/transcript/transcript.pipeline';
import { CurriculumPipeline } from './pipelines/curriculum/curriculum.pipeline';
import { ClassImportPipeline } from './pipelines/class-import/class-import.pipeline';
import { MatrixPipeline } from './pipelines/exports/matrix.pipeline';
import { ExcelBuilder } from './pipelines/exports/excel.builder';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: TranscriptPipeline,
          useValue: { parse: jest.fn() },
        },
        {
          provide: CurriculumPipeline,
          useValue: { parse: jest.fn() },
        },
        {
          provide: ClassImportPipeline,
          useValue: { parse: jest.fn() },
        },
        {
          provide: MatrixPipeline,
          useValue: { buildMatrix: jest.fn() },
        },
        {
          provide: ExcelBuilder,
          useValue: { buildMatrixExcel: jest.fn() },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });
});
