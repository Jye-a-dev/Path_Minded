import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AdvisorsModule } from './modules/advisors/advisors.module';
import { ClassesModule } from './modules/classes/classes.module';
import { ClassImportsModule } from './modules/class_imports/class_imports.module';
import { ClassImportRowsModule } from './modules/class_import_rows/class_import_rows.module';
import { CourseEquivalenciesModule } from './modules/course_equivalencies/course_equivalencies.module';
import { CoursePrerequisitesModule } from './modules/course_prerequisites/course_prerequisites.module';
import { CurriculumImportsModule } from './modules/curriculum_imports/curriculum_imports.module';
import { CurriculumCoursesModule } from './modules/curriculum_courses/curriculum_courses.module';
import { ExportLogsModule } from './modules/export_logs/export_logs.module';
import { ExportsModule } from './modules/exports/exports.module';
import { ParseWarningsModule } from './modules/parse_warnings/parse_warnings.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { StudentCourseResultsModule } from './modules/student_course_results/student_course_results.module';
import { StudentsModule } from './modules/students/students.module';
import { TranscriptUploadsModule } from './modules/transcript_uploads/transcript_uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    AdvisorsModule,
    ProgramsModule,
    ClassesModule,
    StudentsModule,
    CurriculumImportsModule,
    CurriculumCoursesModule,
    TranscriptUploadsModule,
    StudentCourseResultsModule,
    ClassImportsModule,
    ClassImportRowsModule,
    ExportsModule,
    ExportLogsModule,
    ParseWarningsModule,
    CourseEquivalenciesModule,
    CoursePrerequisitesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
