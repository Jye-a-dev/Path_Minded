import { Module } from '@nestjs/common';
import { CoursePrerequisitesController } from './course_prerequisites.controller';
import { CoursePrerequisitesService } from './course_prerequisites.service';

@Module({
  controllers: [CoursePrerequisitesController],
  providers: [CoursePrerequisitesService],
  exports: [CoursePrerequisitesService],
})
export class CoursePrerequisitesModule {}
