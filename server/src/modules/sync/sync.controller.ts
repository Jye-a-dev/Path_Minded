import { Controller, Sse, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SyncService } from './sync.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Real-time Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @ApiOperation({ summary: 'SSE Stream for real-time academic alert updates' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @Public()
  @Sse('alerts/stream')
  streamAlerts(@Query('studentId') studentId: string): Observable<any> {
    return this.syncService.getEvents$().pipe(
      filter((event) => event.studentId === studentId),
      map((event) => ({
        data: {
          type: event.type,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
