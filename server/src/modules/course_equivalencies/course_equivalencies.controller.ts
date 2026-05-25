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
  CourseEquivalenciesPaginationResponse,
  CourseEquivalencyResponse,
} from './interfaces/course_equivalencies.interfaces';
import { CourseEquivalenciesService } from './course_equivalencies.service';

@ApiTags('Course Equivalencies')
@Controller('course_equivalencies')
export class CourseEquivalenciesController {
  constructor(private readonly service: CourseEquivalenciesService) {}

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
  ): Promise<CourseEquivalencyResponse> {
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
  ): Promise<CourseEquivalencyResponse[]> {
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
  ): Promise<CourseEquivalenciesPaginationResponse> {
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
  findOne(@Param('id') id: string): Promise<CourseEquivalencyResponse> {
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
  ): Promise<CourseEquivalencyResponse> {
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
