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
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUsersDto } from './dto/create-users.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import {
  UserResponse,
  UsersPaginationResponse,
} from './interfaces/users.interfaces';
import { UserService } from './user.service';
import type { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Users')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUsersDto })
  @ApiOkResponse({
    description: 'User created',
    schema: {
      example: {
        id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
        email: 'user@example.com',
        role: 'STUDENT',
      },
    },
  })
  @Roles('ADMIN')
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
  @ApiOkResponse({
    description: 'Users list',
    schema: {
      example: [
        {
          id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
          email: 'user@example.com',
          role: 'STUDENT',
        },
      ],
    },
  })
  @Get()
  findAll(@Query() query: QueryUsersDto): Promise<UserResponse[]> {
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
  @ApiOkResponse({
    description: 'Paginated users data',
    schema: {
      example: {
        data: [
          {
            id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
            email: 'user@example.com',
            role: 'STUDENT',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
    },
  })
  @Get('pagination')
  pagination(@Query() query: QueryUsersDto): Promise<UsersPaginationResponse> {
    return this.usersService.pagination(query);
  }

  @ApiOperation({ summary: 'Count users with optional filters' })
  @ApiQuery({ name: 'email', required: false, example: 'gmail.com' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
  })
  @ApiOkResponse({
    description: 'Users count',
    schema: { example: { count: 1 } },
  })
  @Get('count')
  count(@Query() query: QueryUsersDto): Promise<{ count: number }> {
    return this.usersService.countUsers(query);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Current user detail',
    schema: {
      example: {
        id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
        email: 'user@example.com',
        role: 'STUDENT',
      },
    },
  })
  @Get('me')
  findMe(@Req() req: AuthRequest): Promise<UserResponse> {
    return this.usersService.findOne(req.user.id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOkResponse({
    description: 'Current user updated',
    schema: {
      example: {
        id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
        email: 'newmail@example.com',
        role: 'STUDENT',
      },
    },
  })
  @Patch('me')
  updateMe(
    @Req() req: AuthRequest,
    @Body() payload: UpdateUsersDto,
  ): Promise<UserResponse> {
    // Prevent non-admins from changing their role
    if (req.user?.role !== 'ADMIN' && payload.role) {
      delete payload.role;
    }
    return this.usersService.update(req.user.id, payload);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiOkResponse({
    description: 'User detail',
    schema: {
      example: {
        id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
        email: 'user@example.com',
        role: 'STUDENT',
      },
    },
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiBody({ type: UpdateUsersDto })
  @ApiOkResponse({
    description: 'User updated',
    schema: {
      example: {
        id: '9df8ca89-38f4-4d95-a44b-cd91a461d413',
        email: 'newmail@example.com',
        role: 'ADVISOR',
      },
    },
  })
  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateUsersDto,
  ): Promise<UserResponse> {
    return this.usersService.update(id, payload);
  }

  @ApiOperation({ summary: 'Delete user by id (hard delete)' })
  @ApiParam({ name: 'id', example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @ApiOkResponse({
    description: 'Delete result',
    schema: { example: { message: 'Deleted successfully' } },
  })
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Bulk delete users by ids' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  })
  @ApiOkResponse({
    description: 'Bulk delete result',
    schema: { example: { message: 'deleted', deleted: 5 } },
  })
  @Roles('ADMIN')
  @Delete()
  removeMany(
    @Body() body: { ids: string[] },
  ): Promise<{ message: string; deleted: number }> {
    return this.usersService.removeMany(body.ids);
  }
}
