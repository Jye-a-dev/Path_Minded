import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  TranscriptUploadsPaginationResponse,
  TranscriptUploadResponse,
} from './interfaces/transcript_uploads.interfaces';
import { TranscriptUploadsService } from './transcript_uploads.service';

@ApiTags('Import - Transcript (Paste/Text)')
@Controller('transcript_uploads')
export class TranscriptUploadsController {
  constructor(private readonly service: TranscriptUploadsService) {}

  @ApiOperation({
    summary: 'Import transcript paste/text (create upload session)',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceType: { type: 'string', enum: ['file', 'text'] },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Upload Excel file (if sourceType is file)',
        },
        textContent: {
          type: 'string',
          description: 'Paste text content here (if sourceType is text)',
        },
        studentCode: { type: 'string' },
      },
      required: ['sourceType'],
      examples: {
        addFile: {
          value: {
            sourceType: 'file',
            studentCode: 'SE170001',
          },
        },
        pasteText: {
          value: {
            sourceType: 'text',
            textContent: 'MATH101,A,3\nCS101,B+,3',
            studentCode: 'SE170001',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Created successfully',
    schema: {
      example: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Sample Item',
        status: 'ACTIVE',
      },
    },
  })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() payload: Record<string, unknown>,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<any> {
    return this.service.create(payload, file);
  }

  @ApiOperation({ summary: 'List transcript upload sessions' })
  @ApiOkResponse({
    description: 'List data',
    schema: {
      example: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Sample Item',
          status: 'ACTIVE',
        },
      ],
    },
  })
  @Get()
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<TranscriptUploadResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Paginate transcript upload sessions' })
  @ApiOkResponse({
    description: 'Paginated data',
    schema: {
      example: {
        data: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Sample Item',
            status: 'ACTIVE',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
    },
  })
  @Get('pagination')
  pagination(
    @Query() query: Record<string, unknown>,
  ): Promise<TranscriptUploadsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count transcript upload sessions' })
  @ApiOkResponse({
    description: 'Count data',
    schema: { example: { count: 1 } },
  })
  @Get('count')
  count(@Query() query: Record<string, unknown>): Promise<{ count: number }> {
    return this.service.count(query);
  }

  @ApiOperation({ summary: 'Find one by id' })
  @ApiParam({ name: 'id', example: '11111111-1111-1111-1111-111111111111' })
  @ApiOkResponse({
    description: 'Detail data',
    schema: {
      example: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Sample Item',
        status: 'ACTIVE',
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<TranscriptUploadResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id', example: '11111111-1111-1111-1111-111111111111' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceType: { type: 'string', enum: ['file', 'text'] },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Upload Excel file (if sourceType is file)',
        },
        textContent: {
          type: 'string',
          description: 'Paste text content here (if sourceType is text)',
        },
        studentCode: { type: 'string' },
      },
      examples: {
        addFile: {
          value: {
            sourceType: 'file',
            studentCode: 'SE170002',
          },
        },
        pasteText: {
          value: {
            sourceType: 'text',
            textContent: 'ENG101,A,3\nPHY101,B,3',
            studentCode: 'SE170002',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Updated successfully',
    schema: {
      example: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Updated Item',
        status: 'INACTIVE',
      },
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<TranscriptUploadResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete by id' })
  @ApiParam({ name: 'id', example: '11111111-1111-1111-1111-111111111111' })
  @ApiOkResponse({
    description: 'Delete result',
    schema: { example: { message: 'Deleted successfully' } },
  })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.service.remove(id);
  }
}
