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
import { CreateStudentsDto } from './dto/create_students.dto';
import { QuerryStudentsDto } from './dto/querry_students.dto';
import { UpdateStudentsDto } from './dto/update_students.dto';
import {
  StudentsPaginationResponse,
  StudentResponse,
} from './interfaces/students.interfaces';
import { StudentsService } from './students.service';

@ApiTags('Students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @ApiOperation({ summary: 'Create student' })
  @ApiBody({ type: CreateStudentsDto })
  @ApiOkResponse({ description: 'Student created' })
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
  @ApiOkResponse({ description: 'Students list' })
  @Get()
  findAll(@Query() query: QuerryStudentsDto): Promise<StudentResponse[]> {
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
  @ApiOkResponse({ description: 'Paginated students data' })
  @Get('pagination')
  pagination(
    @Query() query: QuerryStudentsDto,
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
  @ApiOkResponse({ description: 'Students count' })
  @Get('count')
  count(@Query() query: QuerryStudentsDto): Promise<{ count: number }> {
    return this.studentsService.countStudents(query);
  }

  @ApiOperation({ summary: 'Get student by id' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiOkResponse({ description: 'Student detail' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<StudentResponse> {
    return this.studentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update student by id' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiBody({ type: UpdateStudentsDto })
  @ApiOkResponse({ description: 'Student updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateStudentsDto,
  ): Promise<StudentResponse> {
    return this.studentsService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete student by id (hard delete)' })
  @ApiParam({ name: 'id', example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @ApiOkResponse({ description: 'Delete result' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.studentsService.remove(id);
  }
}
