import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ExportsPaginationResponse,
  ExportResponse,
} from './interfaces/exports.interfaces';
import { ExportsService, MatrixPreviewData } from './exports.service';

@ApiTags('Exports')
@Controller('exports')
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @ApiOperation({ summary: 'Create' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { name: 'Sample Item', status: 'ACTIVE' },
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
  create(@Body() payload: Record<string, unknown>): Promise<ExportResponse> {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Export matrix for a class' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        classId: { type: 'string', example: 'uuid-of-class' },
        advisorId: { type: 'string', example: 'uuid-of-advisor' },
      },
      required: ['classId'],
    },
  })
  @Post('matrix')
  async exportMatrix(
    @Body() payload: Record<string, unknown>,
    @Res() res: Response,
  ): Promise<void> {
    const classId = payload.classId as string;
    const advisorId = payload.advisorId as string;

    const buffer = await this.service.exportMatrix(classId, advisorId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=Matrix_Export.xlsx',
    );
    res.send(buffer);
  }

  @ApiOperation({ summary: 'Get matrix preview data as JSON for a class' })
  @ApiOkResponse({ description: 'Matrix preview JSON data' })
  @Get('matrix/preview')
  async getMatrixPreview(
    @Query('class_id') classId: string,
  ): Promise<MatrixPreviewData> {
    return this.service.getMatrixPreview(classId);
  }

  @ApiOperation({ summary: 'Find all' })
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
  findAll(@Query() query: Record<string, unknown>): Promise<ExportResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Pagination' })
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
  ): Promise<ExportsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count' })
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
  findOne(@Param('id') id: string): Promise<ExportResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id', example: '11111111-1111-1111-1111-111111111111' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { name: 'Sample Item', status: 'ACTIVE' },
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
  ): Promise<ExportResponse> {
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
