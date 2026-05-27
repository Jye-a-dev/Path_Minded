import { Module } from '@nestjs/common';
import { CurriculumColumnMappingsController } from './curriculum_column_mappings.controller';
import { CurriculumColumnMappingsService } from './curriculum_column_mappings.service';

@Module({
  controllers: [CurriculumColumnMappingsController],
  providers: [CurriculumColumnMappingsService],
  exports: [CurriculumColumnMappingsService],
})
export class CurriculumColumnMappingsModule {}
