import { Module } from '@nestjs/common';
import { CourseEquivalenciesController } from './course_equivalencies.controller';
import { CourseEquivalenciesService } from './course_equivalencies.service';

@Module({
  controllers: [CourseEquivalenciesController],
  providers: [CourseEquivalenciesService],
  exports: [CourseEquivalenciesService],
})
export class CourseEquivalenciesModule {}
