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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  CurriculumImportsPaginationResponse,
  CurriculumImportResponse,
} from './interfaces/curriculum_imports.interfaces';
import { CurriculumImportsService } from './curriculum_imports.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Import - Curriculum (Excel)')
@Roles('ADVISOR', 'ADMIN')
@Controller('curriculum_imports')
export class CurriculumImportsController {
  constructor(private readonly service: CurriculumImportsService) {}

  @ApiOperation({ summary: 'Get curriculum import progress stream (SSE)' })
  @Sse(':id/progress')
  progress(@Param('id') id: string): Observable<MessageEvent> {
    return this.service.getProgressStream(id);
  }

  @ApiOperation({ summary: 'Import curriculum Excel (create import session)' })
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
        note: { type: 'string' },
      },
      required: ['sourceType'],
      examples: {
        addFile: {
          value: {
            sourceType: 'file',
            note: 'Import from uploaded excel file',
          },
        },
        pasteText: {
          value: {
            sourceType: 'text',
            textContent: 'CS101,Calculus I,3',
            note: 'Quick import from pasted text',
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

  @ApiOperation({ summary: 'Confirm curriculum import' })
  @ApiOkResponse({ description: 'Confirmed successfully' })
  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<{ message: string }> {
    return this.service.confirm(id, payload);
  }

  @ApiOperation({ summary: 'Reparse curriculum Excel sheet' })
  @ApiOkResponse({ description: 'Reparsed successfully' })
  @Post(':id/reparse')
  reparse(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<any> {
    return this.service.reparse(id, payload);
  }

  @ApiOperation({ summary: 'List curriculum import sessions' })
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
  ): Promise<CurriculumImportResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Paginate curriculum import sessions' })
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
  ): Promise<CurriculumImportsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count curriculum import sessions' })
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
  findOne(@Param('id') id: string): Promise<CurriculumImportResponse> {
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
        note: { type: 'string' },
      },
      examples: {
        addFile: {
          value: {
            sourceType: 'file',
            note: 'Update uploaded excel file',
          },
        },
        pasteText: {
          value: {
            sourceType: 'text',
            textContent: 'CS201,Data Structures,3',
            note: 'Update from pasted text',
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
  ): Promise<CurriculumImportResponse> {
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
