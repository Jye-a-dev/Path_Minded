import { Module } from '@nestjs/common';
import { CourseTypeMappingsController } from './course_type_mappings.controller';
import { CourseTypeMappingsService } from './course_type_mappings.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CourseTypeMappingsController],
  providers: [CourseTypeMappingsService],
  exports: [CourseTypeMappingsService],
})
export class CourseTypeMappingsModule {}
