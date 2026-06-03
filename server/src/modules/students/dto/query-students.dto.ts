import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';
import type { StudentStatus } from '../interfaces/students.interfaces';

export class QueryStudentsDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'SE17' })
  @IsOptional()
  @IsString()
  student_code?: string;

  @ApiPropertyOptional({ example: 'Nguyen' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2' })
  @IsOptional()
  @IsUUID()
  class_id?: string;

  @ApiPropertyOptional({ example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  @IsOptional()
  @IsUUID()
  program_id?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cohort_year?: number;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'GRADUATED', 'DROPPED'])
  status?: StudentStatus;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  has_grades?: string;
}
