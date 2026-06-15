import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdvisingLogsService } from './advising-logs.service';
import { CreateAdvisingLogDto } from './dto/create-advising-log.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Advisor Logs')
@UseGuards(RolesGuard)
@Roles('ADVISOR', 'ADMIN')
@Controller('alerts/advising-logs')
export class AdvisingLogsController {
  constructor(private readonly advisingLogsService: AdvisingLogsService) {}

  @ApiOperation({ summary: 'Create advising session log' })
  @Post()
  async create(@Body() payload: CreateAdvisingLogDto) {
    return this.advisingLogsService.create(payload);
  }

  @ApiOperation({ summary: 'Get advising logs for a student' })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @Roles('STUDENT', 'ADVISOR', 'ADMIN')
  @Get()
  async findAll(@Query('studentId') studentId: string) {
    if (!studentId) {
      throw new BadRequestException('studentId query param is required');
    }
    return this.advisingLogsService.findAllByStudent(studentId);
  }

  @ApiOperation({ summary: 'Delete advising session log' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.advisingLogsService.remove(id);
  }
}
