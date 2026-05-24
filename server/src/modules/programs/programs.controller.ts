import {
  UseGuards,
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
import { CreateProgramsDto } from './dto/create_programs.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QuerryProgramsDto } from './dto/querry_programs.dto';
import { UpdateProgramsDto } from './dto/update_programs.dto';
import {
  ProgramsPaginationResponse,
  ProgramResponse,
} from './interfaces/programs.interfaces';
import { ProgramsService } from './programs.service';

@ApiTags('Programs')
@UseGuards(RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @ApiOperation({ summary: 'Create program' })
  @ApiBody({ type: CreateProgramsDto })
  @ApiOkResponse({ description: 'Program created' })
  @Roles('ADMIN')
  @Post()
  create(@Body() payload: CreateProgramsDto): Promise<ProgramResponse> {
    return this.programsService.create(payload);
  }

  @ApiOperation({ summary: 'Get all programs with optional filters' })
  @ApiQuery({ name: 'program_code', required: false, example: 'SE' })
  @ApiQuery({ name: 'program_name', required: false, example: 'Software' })
  @ApiQuery({ name: 'major_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'version', required: false, example: '2023.1' })
  @ApiQuery({ name: 'total_credits', required: false, example: 150 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({ description: 'Programs list' })
  @Get()
  findAll(@Query() query: QuerryProgramsDto): Promise<ProgramResponse[]> {
    return this.programsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get programs with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'program_code', required: false, example: 'SE' })
  @ApiQuery({ name: 'program_name', required: false, example: 'Software' })
  @ApiQuery({ name: 'major_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'version', required: false, example: '2023.1' })
  @ApiQuery({ name: 'total_credits', required: false, example: 150 })
  @ApiOkResponse({ description: 'Paginated programs data' })
  @Get('pagination')
  pagination(
    @Query() query: QuerryProgramsDto,
  ): Promise<ProgramsPaginationResponse> {
    return this.programsService.pagination(query);
  }

  @ApiOperation({ summary: 'Count programs with optional filters' })
  @ApiQuery({ name: 'program_code', required: false, example: 'SE' })
  @ApiQuery({ name: 'program_name', required: false, example: 'Software' })
  @ApiQuery({ name: 'major_name', required: false, example: 'Engineering' })
  @ApiQuery({ name: 'version', required: false, example: '2023.1' })
  @ApiQuery({ name: 'total_credits', required: false, example: 150 })
  @ApiOkResponse({ description: 'Programs count' })
  @Get('count')
  count(@Query() query: QuerryProgramsDto): Promise<{ count: number }> {
    return this.programsService.countPrograms(query);
  }

  @ApiOperation({ summary: 'Get program by id' })
  @ApiParam({ name: 'id', example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  @ApiOkResponse({ description: 'Program detail' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ProgramResponse> {
    return this.programsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update program by id' })
  @ApiParam({ name: 'id', example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  @ApiBody({ type: UpdateProgramsDto })
  @ApiOkResponse({ description: 'Program updated' })
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateProgramsDto,
  ): Promise<ProgramResponse> {
    return this.programsService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete program by id (hard delete)' })
  @ApiParam({ name: 'id', example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  @ApiOkResponse({ description: 'Delete result' })
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.programsService.remove(id);
  }
}
