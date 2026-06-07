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
import { CreateStudentsDto } from './dto/create-students.dto';
import { QueryStudentsDto } from './dto/query-students.dto';
import { UpdateStudentsDto } from './dto/update-students.dto';
import {
  StudentsPaginationResponse,
  StudentResponse,
} from './interfaces/students.interfaces';
import { StudentsService } from './students.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Students')
@Roles('STUDENT', 'ADVISOR', 'ADMIN')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: 'Create student' })
  @ApiBody({ type: CreateStudentsDto })
  @ApiOkResponse({
    description: 'Student created',
    schema: {
      example: {
        id: '2e8205c7-f683-41fa-bfdb-fb531bf0999f',
        student_code: 'SE170001',
        full_name: 'Nguyen Van C',
      },
    },
  })
  @Roles('ADVISOR', 'ADMIN')
  @Post()
  create(@Body() payload: CreateStudentsDto): Promise<StudentResponse> {
    return this.studentsService.create(payload);
  }

  @ApiOperation({ summary: 'Get all students with optional filters' })
  @ApiQuery({ name: 'student_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description: 'Students list',
    schema: {
      example: [
        {
          id: '2e8205c7-f683-41fa-bfdb-fb531bf0999f',
          student_code: 'SE170001',
          full_name: 'Nguyen Van C',
        },
      ],
    },
  })
  @Get()
  findAll(@Query() query: QueryStudentsDto): Promise<StudentResponse[]> {
    return this.studentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get students with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'student_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
  })
  @ApiOkResponse({
    description: 'Paginated students data',
    schema: {
      example: {
        data: [
          {
            id: '2e8205c7-f683-41fa-bfdb-fb531bf0999f',
            student_code: 'SE170001',
            full_name: 'Nguyen Van C',
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
    @Query() query: QueryStudentsDto,
  ): Promise<StudentsPaginationResponse> {
    return this.studentsService.pagination(query);
  }

  @ApiOperation({ summary: 'Count students with optional filters' })
  @ApiQuery({ name: 'student_code', required: false, example: 'SE17' })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2',
  })
  @ApiQuery({
    name: 'program_id',
    required: false,
    example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622',
  })
  @ApiQuery({ name: 'cohort_year', required: false, example: 2023 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
  })
  @ApiOkResponse({
    description: 'Students count',
    schema: { example: { count: 1 } },
  })
  @Get('count')
  count(@Query() query: QueryStudentsDto): Promise<{ count: number }> {
    return this.studentsService.countStudents(query);
  }

  @ApiOperation({ summary: 'Get student by id' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiOkResponse({
    description: 'Student detail',
    schema: {
      example: {
        id: '2e8205c7-f683-41fa-bfdb-fb531bf0999f',
        student_code: 'SE170001',
        full_name: 'Nguyen Van C',
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<StudentResponse> {
    return this.studentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update student by id' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiBody({ type: UpdateStudentsDto })
  @ApiOkResponse({
    description: 'Student updated',
    schema: {
      example: {
        id: '2e8205c7-f683-41fa-bfdb-fb531bf0999f',
        student_code: 'SE170002',
        full_name: 'Nguyen Van D',
      },
    },
  })
  @Roles('ADVISOR', 'ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateStudentsDto,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete student by id (hard delete)' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiOkResponse({
    description: 'Delete result',
    schema: { example: { message: 'Deleted successfully' } },
  })
  @Roles('ADVISOR', 'ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.studentsService.remove(id);
  }

  @ApiOperation({ summary: 'Delete ALL students (hard delete — irreversible)' })
  @ApiOkResponse({
    description: 'All students deleted',
    schema: { example: { message: 'all students deleted', deleted: 120 } },
  })
  @Roles('ADVISOR', 'ADMIN')
  @Delete()
  removeAll(): Promise<{ message: string; deleted: number }> {
    return this.studentsService.removeAll();
  }

  @ApiOperation({
    summary:
      'Sync students user_id by matching full_name to users.display_name',
  })
  @ApiQuery({
    name: 'class_id',
    required: false,
    description: 'Filter sync to a specific class',
  })
  @ApiOkResponse({
    description: 'Sync result',
    schema: { example: { message: 'sync completed', synced: 42 } },
  })
  @Roles('ADVISOR', 'ADMIN')
  @Post('sync-users')
  syncUsers(
    @Query('class_id') classId?: string,
  ): Promise<{ message: string; synced: number }> {
    return this.studentsService.syncUsers(classId);
  }
}
