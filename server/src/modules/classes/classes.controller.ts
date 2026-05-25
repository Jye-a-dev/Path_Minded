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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassesDto } from './dto/create-classes.dto';
import { QueryClassesDto } from './dto/query-classes.dto';
import { UpdateClassesDto } from './dto/update-classes.dto';
import {
  ClassesPaginationResponse,
  ClassResponse,
} from './interfaces/classes.interfaces';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @ApiOperation({ summary: 'Create class' })
  @ApiBody({ type: CreateClassesDto })
  @ApiOkResponse({
    description: 'Class created',
    schema: {
      example: {
        id: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
        class_code: 'SE17A',
        class_name: 'Software Engineering K17A',
      },
    },
  })
  @Post()
  create(@Body() payload: CreateClassesDto): Promise<ClassResponse> {
    return this.classesService.create(payload);
  }

  @ApiOperation({ summary: 'Get all classes with optional filters' })
  @ApiQuery({ name: 'class_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'class_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'advisor_id',
    required: false,
    example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description: 'Classes list',
    schema: {
      example: [
        {
          id: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
          class_code: 'SE17A',
          class_name: 'Software Engineering K17A',
        },
      ],
    },
  })
  @Get()
  findAll(@Query() query: QueryClassesDto): Promise<ClassResponse[]> {
    return this.classesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get classes with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'class_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'class_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'advisor_id',
    required: false,
    example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiOkResponse({
    description: 'Paginated classes data',
    schema: {
      example: {
        data: [
          {
            id: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
            class_code: 'SE17A',
            class_name: 'Software Engineering K17A',
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
    @Query() query: QueryClassesDto,
  ): Promise<ClassesPaginationResponse> {
    return this.classesService.pagination(query);
  }

  @ApiOperation({ summary: 'Count classes with optional filters' })
  @ApiQuery({ name: 'class_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'class_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'advisor_id',
    required: false,
    example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiOkResponse({
    description: 'Classes count',
    schema: { example: { count: 1 } },
  })
  @Get('count')
  count(@Query() query: QueryClassesDto): Promise<{ count: number }> {
    return this.classesService.countClasses(query);
  }

  @ApiOperation({ summary: 'Get class by id' })
  @ApiParam({ name: 'id', example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2' })
  @ApiOkResponse({
    description: 'Class detail',
    schema: {
      example: {
        id: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
        class_code: 'SE17A',
        class_name: 'Software Engineering K17A',
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClassResponse> {
    return this.classesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update class by id' })
  @ApiParam({ name: 'id', example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2' })
  @ApiBody({ type: UpdateClassesDto })
  @ApiOkResponse({
    description: 'Class updated',
    schema: {
      example: {
        id: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
        class_code: 'SE18A',
        class_name: 'Software Engineering K18A',
      },
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateClassesDto,
  ): Promise<ClassResponse> {
    return this.classesService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete class by id (hard delete)' })
  @ApiParam({ name: 'id', example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2' })
  @ApiOkResponse({
    description: 'Delete result',
    schema: { example: { message: 'Deleted successfully' } },
  })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.classesService.remove(id);
  }
}
