import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CoursePrerequisitesPaginationResponse,
  CoursePrerequisiteResponse,
} from './interfaces/course_prerequisites.interfaces';
import { CoursePrerequisitesService } from './course_prerequisites.service';

@ApiTags('Course Prerequisites')
@Controller('course_prerequisites')
export class CoursePrerequisitesController {
  constructor(private readonly service: CoursePrerequisitesService) {}

  @ApiOperation({ summary: 'Create' })
  @ApiBody({ schema: { type: 'object' } })
  @Post()
  create(@Body() payload: Record<string, unknown>): Promise<CoursePrerequisiteResponse> {
    return this.service.create(payload);
  }

  @ApiOperation({ summary: 'Find all' })
  @Get()
  findAll(@Query() query: Record<string, unknown>): Promise<CoursePrerequisiteResponse[]> {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: 'Pagination' })
  @Get('pagination')
  pagination(@Query() query: Record<string, unknown>): Promise<CoursePrerequisitesPaginationResponse> {
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
  findOne(@Param('id') id: string): Promise<CoursePrerequisiteResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id' })
  @ApiBody({ schema: { type: 'object' } })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<CoursePrerequisiteResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete by id' })
  @ApiParam({ name: 'id' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.service.remove(id);
  }
}
