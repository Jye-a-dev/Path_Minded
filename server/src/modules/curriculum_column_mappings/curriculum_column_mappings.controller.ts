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
  CurriculumColumnMappingsPaginationResponse,
  CurriculumColumnMappingResponse,
} from './interfaces/curriculum_column_mappings.interfaces';
import { CurriculumColumnMappingsService } from './curriculum_column_mappings.service';
import { CreateCurriculumColumnMappingDto } from './dto/create-curriculum-column-mapping.dto';
import { UpdateCurriculumColumnMappingDto } from './dto/update-curriculum-column-mapping.dto';

@ApiTags('Curriculum Column Mappings')
@Controller('curriculum_column_mappings')
export class CurriculumColumnMappingsController {
  constructor(private readonly service: CurriculumColumnMappingsService) {}

  @ApiOperation({ summary: 'Create' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        field_key: 'custom_field',
        display_label: 'Trường tùy biến',
        phrases: ['custom'],
      },
    },
  })
  @ApiOkResponse({
    description: 'Created successfully',
    schema: {
      example: {
        id: '11111111-1111-1111-1111-111111111111',
        field_key: 'custom_field',
        display_label: 'Trường tùy biến',
        phrases: ['custom'],
      },
    },
  })
  @Post()
  create(
    @Body() payload: CreateCurriculumColumnMappingDto,
  ): Promise<CurriculumColumnMappingResponse> {
    return this.service.create(payload as unknown as Record<string, unknown>);
  }

  @ApiOperation({ summary: 'Find all' })
  @ApiOkResponse({
    description: 'List data',
    schema: {
      example: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          field_key: 'course_code',
          display_label: 'Mã môn học',
          phrases: ['mã học phần', 'mã hp'],
        },
      ],
    },
  })
  @Get()
  findAll(
    @Query() query: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingResponse[]> {
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
            field_key: 'course_code',
            display_label: 'Mã môn học',
            phrases: ['mã học phần', 'mã hp'],
          },
        ],
        total: 12,
        page: 1,
        limit: 20,
      },
    },
  })
  @Get('pagination')
  pagination(
    @Query() query: Record<string, unknown>,
  ): Promise<CurriculumColumnMappingsPaginationResponse> {
    return this.service.pagination(query);
  }

  @ApiOperation({ summary: 'Count' })
  @ApiOkResponse({
    description: 'Count data',
    schema: { example: { count: 12 } },
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
        field_key: 'course_code',
        display_label: 'Mã môn học',
        phrases: ['mã học phần', 'mã hp'],
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CurriculumColumnMappingResponse> {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update by id' })
  @ApiParam({ name: 'id', example: '11111111-1111-1111-1111-111111111111' })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        display_label: 'Mã học phần mới',
        phrases: ['mã hp', 'code new'],
      },
    },
  })
  @ApiOkResponse({
    description: 'Updated successfully',
    schema: {
      example: {
        id: '11111111-1111-1111-1111-111111111111',
        field_key: 'course_code',
        display_label: 'Mã học phần mới',
        phrases: ['mã hp', 'code new'],
      },
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateCurriculumColumnMappingDto,
  ): Promise<CurriculumColumnMappingResponse> {
    return this.service.update(
      id,
      payload as unknown as Record<string, unknown>,
    );
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
