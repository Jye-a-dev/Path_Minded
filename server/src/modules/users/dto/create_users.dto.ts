import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../interfaces/users.interfaces';

export class CreateUsersDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['STUDENT', 'ADVISOR', 'ADMIN'], example: 'STUDENT' })
  @IsIn(['STUDENT', 'ADVISOR', 'ADMIN'])
  role: UserRole;
}
