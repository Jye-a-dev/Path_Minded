import { Module } from '@nestjs/common';
import { StudentCourseResultsController } from './student_course_results.controller';
import { StudentCourseResultsService } from './student_course_results.service';

@Module({
  controllers: [StudentCourseResultsController],
  providers: [StudentCourseResultsService],
  exports: [StudentCourseResultsService],
})
export class StudentCourseResultsModule {}
