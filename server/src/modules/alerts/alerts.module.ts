import { Module } from '@nestjs/common';
import { AlertEvaluationService } from './alert-evaluation.service';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';
import { AdvisingLogsService } from './advising-logs.service';
import { AdvisingLogsController } from './advising-logs.controller';

@Module({
  controllers: [GraphController, AdvisingLogsController],
  providers: [AlertEvaluationService, GraphService, AdvisingLogsService],
  exports: [AlertEvaluationService, GraphService, AdvisingLogsService],
})
export class AlertsModule {}

