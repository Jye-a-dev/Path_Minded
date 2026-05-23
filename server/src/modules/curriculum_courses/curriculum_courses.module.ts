import { Module } from '@nestjs/common';
import { CurriculumCoursesController } from './curriculum_courses.controller';
import { CurriculumCoursesService } from './curriculum_courses.service';

@Module({
  controllers: [CurriculumCoursesController],
  providers: [CurriculumCoursesService],
  exports: [CurriculumCoursesService],
})
export class CurriculumCoursesModule {}
