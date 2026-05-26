import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import type { StudentStatus } from '../interfaces/students.interfaces';

export class CreateStudentsDto {
  @ApiProperty({ example: 'SE170001' })
  @IsString()
  student_code: string;

  @ApiProperty({ example: 'Nguyen Van C' })
  @IsString()
  full_name: string;

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
  @IsInt()
  @Min(1900)
  cohort_year?: number;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsIn(['ACTIVE', 'GRADUATED', 'DROPPED'])
  status?: StudentStatus;
}
