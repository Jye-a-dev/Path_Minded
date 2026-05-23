import { Module } from '@nestjs/common';
import { ExportLogsController } from './export_logs.controller';
import { ExportLogsService } from './export_logs.service';

@Module({
  controllers: [ExportLogsController],
  providers: [ExportLogsService],
  exports: [ExportLogsService],
})
export class ExportLogsModule {}

