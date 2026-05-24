import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  TranscriptUploadsPaginationResponse,
  TranscriptUploadResponse,
} from './interfaces/transcript_uploads.interfaces';
import { TranscriptUploadsService } from './transcript_uploads.service';

@ApiTags('Import - Transcript (Paste/Text)')
@Controller('transcript_uploads')
export class TranscriptUploadsController {
  constructor(private readonly service: TranscriptUploadsService) {}

  @ApiOperation({ summary: 'Import transcript paste/text (create upload session)' })
  @ApiBody({ schema: { type: 'object' } })
  @Post()
  create(@Body() payload: Record<string, unknown>): Promise<TranscriptUploadResponse> {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'List transcript upload sessions' })
  @Get()
  findAll(@Query() query: Record<string, unknown>): Promise<TranscriptUploadResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Paginate transcript upload sessions' })
  @Get('pagination')
  pagination(@Query() query: Record<string, unknown>): Promise<TranscriptUploadsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count transcript upload sessions' })
  @Get('count')
  count(@Query() query: Record<string, unknown>): Promise<{ count: number }> {
    return this.service.count(query);
  }

  @ApiOperation({ summary: 'Find one by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<TranscriptUploadResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object' } })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<TranscriptUploadResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete by id' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.service.remove(id);
  }
}
