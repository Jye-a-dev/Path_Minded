import { Module } from '@nestjs/common';
import { TranscriptUploadsController } from './transcript_uploads.controller';
import { TranscriptUploadsService } from './transcript_uploads.service';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AlertsModule],
  controllers: [TranscriptUploadsController],
  providers: [TranscriptUploadsService],
  exports: [TranscriptUploadsService],
})
export class TranscriptUploadsModule {}
