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
import { CreateUsersDto } from './dto/create_users.dto';
import { QuerryUsersDto } from './dto/querry_users.dto';
import { UpdateUsersDto } from './dto/update_users.dto';
import {
  UserResponse,
  UsersPaginationResponse,
} from './interfaces/users.interfaces';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUsersDto })
  @ApiOkResponse({ description: 'User created' })
  @Post()
  create(@Body() payload: CreateUsersDto): Promise<UserResponse> {
    return this.usersService.create(payload);
  }

  @ApiOperation({ summary: 'Get all users with optional filters' })
  @ApiQuery({ name: 'email', required: false, example: 'example@gmail.com' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiOkResponse({ description: 'Users list' })
  @Get()
  findAll(@Query() query: QuerryUsersDto): Promise<UserResponse[]> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: 'Get users with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'email', required: false, example: 'example@gmail.com' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
  })
  @ApiOkResponse({ description: 'Paginated users data' })
  @Get('pagination')
  pagination(@Query() query: QuerryUsersDto): Promise<UsersPaginationResponse> {
    return this.usersService.pagination(query);
  }

  @ApiOperation({ summary: 'Count users with optional filters' })
  @ApiQuery({ name: 'email', required: false, example: 'gmail.com' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
  })
  @ApiOkResponse({ description: 'Users count' })
  @Get('count')
  count(@Query() query: QuerryUsersDto): Promise<{ count: number }> {
    return this.usersService.countUsers(query);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiOkResponse({ description: 'User detail' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOkResponse({ description: 'User updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateUsersDto,
  ): Promise<UserResponse> {
    return this.usersService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete user by id (hard delete)' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiOkResponse({ description: 'Delete result' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
