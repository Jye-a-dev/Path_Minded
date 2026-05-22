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
import { CreateUsersDto } from './dto/create_users.dto';
import { QuerryUsersDto } from './dto/querry_users.dto';
import { UpdateUsersDto } from './dto/update_users.dto';
import { UserResponse } from './interfaces/users.interfaces';
import { UserService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  create(@Body() payload: CreateUsersDto): Promise<UserResponse> {
    return this.usersService.create(payload);
  }

  @Get()
  findAll(@Query() query: QuerryUsersDto): Promise<UserResponse[]> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateUsersDto,
  ): Promise<UserResponse> {
    return this.usersService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
