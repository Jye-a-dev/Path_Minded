import { Module } from '@nestjs/common';
import { ClassImportRowsController } from './class_import_rows.controller';
import { ClassImportRowsService } from './class_import_rows.service';

@Module({
  controllers: [ClassImportRowsController],
  providers: [ClassImportRowsService],
  exports: [ClassImportRowsService],
})
export class ClassImportRowsModule {}
