import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  ExportLogsPaginationResponse,
  ExportLogResponse,
} from './interfaces/export_logs.interfaces';
import { ExportLogsService } from './export_logs.service';

@ApiTags('Export Logss')
@Controller('export_logs')
export class ExportLogsController {
  constructor(private readonly service: ExportLogsService) {}

  @ApiOperation({ summary: 'Create' })
  @ApiBody({ schema: { type: 'object' } })
  @Post()
  create(@Body() payload: Record<string, unknown>): Promise<ExportLogResponse> {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Find all' })
  @Get()
  findAll(@Query() query: Record<string, unknown>): Promise<ExportLogResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Pagination' })
  @Get('pagination')
  pagination(@Query() query: Record<string, unknown>): Promise<ExportLogsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count' })
  @Get('count')
  count(@Query() query: Record<string, unknown>): Promise<{ count: number }> {
    return this.service.count(query);
  }

  @ApiOperation({ summary: 'Find one by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ExportLogResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object' } })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<ExportLogResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete by id' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.service.remove(id);
  }
}

