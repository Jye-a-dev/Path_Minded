import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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

  // Microsoft Graph profile fields
  @ApiPropertyOptional({ example: 'abc123-object-id' })
  @IsOptional()
  @IsString()
  ms_id?: string;

  @ApiPropertyOptional({ example: 'user@domain.com' })
  @IsOptional()
  @IsString()
  user_principal_name?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiPropertyOptional({ example: 'Van A' })
  @IsOptional()
  @IsString()
  given_name?: string;

  @ApiPropertyOptional({ example: 'Nguyen' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ example: 'user@domain.com' })
  @IsOptional()
  @IsString()
  mail?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiPropertyOptional({ example: '+84901234567' })
  @IsOptional()
  @IsString()
  mobile_phone?: string;

  @ApiPropertyOptional({ example: ['+84281234567'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  business_phones?: string[];

  @ApiPropertyOptional({ example: 'Building A, Room 101' })
  @IsOptional()
  @IsString()
  office_location?: string;

  @ApiPropertyOptional({ example: 'vi-VN' })
  @IsOptional()
  @IsString()
  preferred_language?: string;
}
