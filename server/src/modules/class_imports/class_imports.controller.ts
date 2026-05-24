import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
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
  @ApiBody({ schema: { type: 'object' } })
  @Post()
  create(@Body() payload: Record<string, unknown>): Promise<ClassImportResponse> {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'List class import sessions' })
  @Get()
  findAll(@Query() query: Record<string, unknown>): Promise<ClassImportResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Paginate class import sessions' })
  @Get('pagination')
  pagination(@Query() query: Record<string, unknown>): Promise<ClassImportsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count class import sessions' })
  @Get('count')
  count(@Query() query: Record<string, unknown>): Promise<{ count: number }> {
    return this.service.count(query);
  }

  @ApiOperation({ summary: 'Find one by id' })
  @ApiParam({ name: 'id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassImportResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object' } })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<ClassImportResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete by id' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.service.remove(id);
  }
}
