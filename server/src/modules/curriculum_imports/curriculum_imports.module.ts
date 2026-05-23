import { Module } from '@nestjs/common';
import { CurriculumImportsController } from './curriculum_imports.controller';
import { CurriculumImportsService } from './curriculum_imports.service';

@Module({
  controllers: [CurriculumImportsController],
  providers: [CurriculumImportsService],
  exports: [CurriculumImportsService],
})
export class CurriculumImportsModule {}

