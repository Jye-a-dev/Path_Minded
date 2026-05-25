import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { UserRole } from '../interfaces/users.interfaces';

export class UpdateUsersDto {
  @ApiPropertyOptional({ example: 'newmail@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'N3wP@ssw0rd' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    example: 'ADVISOR',
  })
  @IsOptional()
  @IsIn(['STUDENT', 'ADVISOR', 'ADMIN'])
  role?: UserRole;
}
