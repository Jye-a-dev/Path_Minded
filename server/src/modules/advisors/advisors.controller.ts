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
import { CreateAdvisorsDto } from './dto/create-advisors.dto';
import { QueryAdvisorsDto } from './dto/query-advisors.dto';
import { UpdateAdvisorsDto } from './dto/update-advisors.dto';
import {
  AdvisorsPaginationResponse,
  AdvisorResponse,
} from './interfaces/advisors.interfaces';
import { AdvisorsService } from './advisors.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Advisors')
@Roles('ADVISOR', 'ADMIN')
@Controller('advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @ApiOperation({ summary: 'Create advisor' })
  @ApiBody({ type: CreateAdvisorsDto })
  @ApiOkResponse({
    description: 'Advisor created',
    schema: {
      example: {
        id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
        full_name: 'Nguyen Van A',
        department: 'Computer Science',
      },
    },
  })
  @Post()
  create(@Body() payload: CreateAdvisorsDto): Promise<AdvisorResponse> {
    return this.advisorsService.create(payload);
  }

  @ApiOperation({ summary: 'Get all advisors with optional filters' })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Computer Science',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({
    description: 'Advisors list',
    schema: {
      example: [
        {
          id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
          full_name: 'Nguyen Van A',
          department: 'Computer Science',
        },
      ],
    },
  })
  @Get()
  findAll(@Query() query: QueryAdvisorsDto): Promise<AdvisorResponse[]> {
    return this.advisorsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get advisors with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Computer Science',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiOkResponse({
    description: 'Paginated advisors data',
    schema: {
      example: {
        data: [
          {
            id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
            full_name: 'Nguyen Van A',
            department: 'Computer Science',
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
    @Query() query: QueryAdvisorsDto,
  ): Promise<AdvisorsPaginationResponse> {
    return this.advisorsService.pagination(query);
  }

  @ApiOperation({ summary: 'Count advisors with optional filters' })
  @ApiQuery({ name: 'full_name', required: false, example: 'Nguyen' })
  @ApiQuery({
    name: 'department',
    required: false,
    example: 'Computer Science',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    example: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
  })
  @ApiOkResponse({
    description: 'Advisors count',
    schema: { example: { count: 1 } },
  })
  @Get('count')
  count(@Query() query: QueryAdvisorsDto): Promise<{ count: number }> {
    return this.advisorsService.countAdvisors(query);
  }

  @ApiOperation({ summary: 'Get advisor by id' })
  @ApiParam({ name: 'id', example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9' })
  @ApiOkResponse({
    description: 'Advisor detail',
    schema: {
      example: {
        id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
        full_name: 'Nguyen Van A',
        department: 'Computer Science',
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<AdvisorResponse> {
    return this.advisorsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update advisor by id' })
  @ApiParam({ name: 'id', example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9' })
  @ApiBody({ type: UpdateAdvisorsDto })
  @ApiOkResponse({
    description: 'Advisor updated',
    schema: {
      example: {
        id: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9',
        full_name: 'Nguyen Van B',
        department: 'Data Science',
      },
    },
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateAdvisorsDto,
  ): Promise<AdvisorResponse> {
    return this.advisorsService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete advisor by id (hard delete)' })
  @ApiParam({ name: 'id', example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9' })
  @ApiOkResponse({
    description: 'Delete result',
    schema: { example: { message: 'Deleted successfully' } },
  })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.advisorsService.remove(id);
  }
}
