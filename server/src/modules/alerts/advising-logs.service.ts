import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { DB_PROVIDER } from '../../constants/app.constant';
import { CreateAdvisingLogDto } from './dto/create-advising-log.dto';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class AdvisingLogsService {
  private readonly logger = new Logger(AdvisingLogsService.name);

  constructor(
    @Inject(DB_PROVIDER.PG_POOL) private readonly pool: Pool,
    private readonly syncService: SyncService,
  ) {}

  async create(payload: CreateAdvisingLogDto): Promise<any> {
    this.logger.log(`Creating advising log for student ${payload.student_id}`);
    
    try {
      const result = await this.pool.query(
        `
          INSERT INTO advising_logs (student_id, advisor_id, alert_id, content)
          VALUES ($1, $2, $3, $4)
          RETURNING id, student_id, advisor_id, alert_id, log_date, content, created_at, updated_at
        `,
        [
          payload.student_id,
          payload.advisor_id ?? null,
          payload.alert_id ?? null,
          payload.content,
        ],
      );

      const log = result.rows[0];

      // Notify the student portal via SSE in real-time
      this.syncService.emitUpdate(payload.student_id, 'advising_log_added');

      return log;
    } catch (error) {
      this.logger.error(`Error creating advising log: ${error.message}`);
      throw new BadRequestException(`Failed to create advising log: ${error.message}`);
    }
  }

  async findAllByStudent(studentId: string): Promise<any[]> {
    const result = await this.pool.query(
      `
        SELECT 
          al.id, 
          al.student_id, 
          al.advisor_id, 
          al.alert_id, 
          al.log_date, 
          al.content, 
          al.created_at, 
          al.updated_at,
          adv.full_name AS advisor_name,
          aa.alert_type,
          aa.description AS alert_description
        FROM advising_logs al
        LEFT JOIN advisors adv ON al.advisor_id = adv.id
        LEFT JOIN academic_alerts aa ON al.alert_id = aa.id
        WHERE al.student_id = $1
        ORDER BY al.log_date DESC
      `,
      [studentId],
    );

    return result.rows;
  }

  async remove(id: string): Promise<{ message: string }> {
    // 1. Fetch student_id to trigger SSE notification afterwards
    const checkResult = await this.pool.query(
      `SELECT student_id FROM advising_logs WHERE id = $1`,
      [id],
    );

    if (checkResult.rowCount === 0) {
      throw new NotFoundException('Advising log not found');
    }

    const studentId = checkResult.rows[0].student_id;

    // 2. Perform deletion
    await this.pool.query(
      `DELETE FROM advising_logs WHERE id = $1`,
      [id],
    );

    // 3. Emit sync notification
    this.syncService.emitUpdate(studentId, 'advising_log_deleted');

    return { message: 'Deleted advising log successfully' };
  }
}
