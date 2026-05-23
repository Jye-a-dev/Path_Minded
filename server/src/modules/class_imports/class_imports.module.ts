import { Module } from '@nestjs/common';
import { ClassImportsController } from './class_imports.controller';
import { ClassImportsService } from './class_imports.service';

@Module({
  controllers: [ClassImportsController],
  providers: [ClassImportsService],
  exports: [ClassImportsService],
})
export class ClassImportsModule {}
