import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GraphService } from './graph.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SyncService } from '../sync/sync.service';
import { Roles } from '../../common/decorators/roles.decorator';

interface AcademicAlert {
  id: string;
  student_id: string;
  alert_type: string;
  alert_status: string;
  description: string;
}

@ApiTags('Academic Graph Tools')
@UseGuards(RolesGuard)
@Controller('alerts')
export class GraphController {
  constructor(
    private readonly graphService: GraphService,
    private readonly syncService: SyncService,
  ) {}

  @ApiOperation({
    summary: 'Get program bottleneck courses ranked by out-degree',
  })
  @ApiQuery({ name: 'programId', required: true, type: String })
  @Get('bottlenecks')
  async getBottlenecks(@Query('programId') programId: string): Promise<any[]> {
    if (!programId) {
      throw new BadRequestException('programId is required');
    }
    return this.graphService.getBottleneckCourses(programId);
  }

  @ApiOperation({
    summary: 'Simulate prerequisite delay when failing a specific course',
  })
  @Post('simulate-delay')
  async simulateDelay(
    @Body() payload: { studentId: string; failedCourseCode: string },
  ): Promise<any> {
    if (!payload.studentId || !payload.failedCourseCode) {
      throw new BadRequestException(
        'studentId and failedCourseCode are required',
      );
    }
    return this.graphService.simulateDelay(
      payload.studentId,
      payload.failedCourseCode,
    );
  }

  @ApiOperation({
    summary:
      'Get priority suggestions for course registrations in next semester',
  })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @ApiQuery({ name: 'limitCredits', required: false, type: Number })
  @Get('suggest-courses')
  async suggestCourses(
    @Query('studentId') studentId: string,
    @Query('limitCredits') limitCredits?: number,
  ): Promise<any[]> {
    if (!studentId) {
      throw new BadRequestException('studentId is required');
    }
    const credits = limitCredits ? Number(limitCredits) : 18;
    return this.graphService.suggestNextCourses(studentId, credits);
  }

  @ApiOperation({ summary: 'Get active academic warning for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @Get('active')
  async getActiveAlert(@Query('studentId') studentId: string): Promise<any> {
    if (!studentId) {
      throw new BadRequestException('studentId is required');
    }
    return this.graphService.getActiveAlert(studentId);
  }

  @ApiOperation({ summary: 'Update academic warning status' })
  @Roles('ADVISOR', 'ADMIN')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() payload: { status: 'ACTIVE' | 'RESOLVED' },
  ): Promise<AcademicAlert> {
    if (!payload.status || !['ACTIVE', 'RESOLVED'].includes(payload.status)) {
      throw new BadRequestException('status must be ACTIVE or RESOLVED');
    }
    try {
      const alert = (await this.graphService.updateAlertStatus(
        id,
        payload.status,
      )) as AcademicAlert;

      // Notify client in real-time
      this.syncService.emitUpdate(alert.student_id, 'alert_status_updated');

      return alert;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error updating alert status';
      throw new BadRequestException(message);
    }
  }
}
