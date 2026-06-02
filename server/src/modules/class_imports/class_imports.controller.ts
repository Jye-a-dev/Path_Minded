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
  ClassImportsPaginationResponse,
  ClassImportResponse,
} from './interfaces/class_imports.interfaces';
import { ClassImportsService } from './class_imports.service';

@ApiTags('Import - Class List (Excel)')
@Controller('class_imports')
export class ClassImportsController {
  constructor(private readonly service: ClassImportsService) {}

  @ApiOperation({ summary: 'Import class list Excel (create import session)' })
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
            textContent: 'SE17A,Software Engineering K17A,2023',
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

  @ApiOperation({ summary: 'Confirm class list import' })
  @ApiOkResponse({ description: 'Confirmed successfully' })
  @Post(':id/confirm')
  confirm(
    @Param('id') id: string,
    @Body()
    body?: {
      students?: {
        student_code: string;
        full_name: string;
        email: string | null;
      }[];
    },
  ): Promise<{ message: string }> {
    return this.service.confirm(id, body);
  }

  @ApiOperation({ summary: 'List class import sessions' })
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
  ): Promise<ClassImportResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Paginate class import sessions' })
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
  ): Promise<ClassImportsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count class import sessions' })
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
  findOne(@Param('id') id: string): Promise<ClassImportResponse> {
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
            textContent: 'SE18A,Software Engineering K18A,2024',
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
  ): Promise<ClassImportResponse> {
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
