import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurriculumCoursesPaginationResponse,
  CurriculumCourseResponse,
} from './interfaces/curriculum_courses.interfaces';
import { CurriculumCoursesService } from './curriculum_courses.service';

@ApiTags('Curriculum Courses')
@Controller('curriculum_courses')
export class CurriculumCoursesController {
  constructor(private readonly service: CurriculumCoursesService) {}

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
  create(
    @Body() payload: Record<string, unknown>,
  ): Promise<CurriculumCourseResponse> {
    return this.service.create(payload);
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
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<CurriculumCourseResponse[]> {
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
  ): Promise<CurriculumCoursesPaginationResponse> {
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
  findOne(@Param('id') id: string): Promise<CurriculumCourseResponse> {
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
  ): Promise<CurriculumCourseResponse> {
    return this.service.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete all' })
  @ApiOkResponse({
    description: 'Delete all result',
    schema: { example: { message: 'all deleted', count: 100 } },
  })
  @Delete('all')
  removeAll(): Promise<{ message: string; count: number }> {
    return this.service.removeAll();
  }

  @ApiOperation({ summary: 'Delete bulk' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiOkResponse({
    description: 'Delete bulk result',
    schema: { example: { message: 'bulk deleted', count: 5 } },
  })
  @Delete('bulk')
  removeBulk(
    @Body('ids') ids: string[],
  ): Promise<{ message: string; count: number }> {
    return this.service.removeBulk(ids);
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
