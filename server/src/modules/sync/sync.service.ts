import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private readonly eventSubject = new Subject<{
    studentId: string;
    type: string;
  }>();

  /**
   * Emits an academic update event for a student (e.g. advising log added, alert resolved)
   */
  emitUpdate(studentId: string, type: string) {
    this.logger.log(
      `Emitting sync update of type "${type}" for student: ${studentId}`,
    );
    this.eventSubject.next({ studentId, type });
  }

  /**
   * Returns the event stream
   */
  getEvents$(): Observable<{ studentId: string; type: string }> {
    return this.eventSubject.asObservable();
  }
}
