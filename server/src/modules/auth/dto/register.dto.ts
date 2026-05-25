import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { UserRole } from '../../users/interfaces/users.interfaces';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    required: false,
    default: 'STUDENT',
  })
  @IsOptional()
  @IsIn(['STUDENT', 'ADVISOR', 'ADMIN'])
  role?: UserRole;
}
