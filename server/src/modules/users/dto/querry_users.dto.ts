import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import type { UserRole } from '../interfaces/users.interfaces';

export class QuerryUsersDto {
  @ApiPropertyOptional({ example: 'example@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    example: 'STUDENT',
  })
  @IsOptional()
  @IsIn(['STUDENT', 'ADVISOR', 'ADMIN'])
  role?: UserRole;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
