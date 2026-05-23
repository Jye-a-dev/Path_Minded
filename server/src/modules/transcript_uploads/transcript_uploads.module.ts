import { Module } from '@nestjs/common';
import { TranscriptUploadsController } from './transcript_uploads.controller';
import { TranscriptUploadsService } from './transcript_uploads.service';

@Module({
  controllers: [TranscriptUploadsController],
  providers: [TranscriptUploadsService],
  exports: [TranscriptUploadsService],
})
export class TranscriptUploadsModule {}
