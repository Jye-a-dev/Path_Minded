import { Module } from '@nestjs/common';
import { CurriculumImportsController } from './curriculum_imports.controller';
import { CurriculumImportsService } from './curriculum_imports.service';
import { CourseTypeMappingsModule } from '../course_type_mappings/course_type_mappings.module';

@Module({
  imports: [CourseTypeMappingsModule],
  controllers: [CurriculumImportsController],
  providers: [CurriculumImportsService],
  exports: [CurriculumImportsService],
})
export class CurriculumImportsModule {}
