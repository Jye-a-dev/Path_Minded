import { ApiPropertyOptional } from '@nestjs/swagger';
import type { StudentStatus } from '../interfaces/students.interfaces';

export class UpdateStudentsDto {
  @ApiPropertyOptional({ example: 'SE170002' })
  student_code?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van D' })
  full_name?: string;

  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  user_id?: string;

  @ApiPropertyOptional({ example: '0d8a4b17-4642-4204-95b2-7e238f1f3af2' })
  class_id?: string;

  @ApiPropertyOptional({ example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  program_id?: string;

  @ApiPropertyOptional({ example: 2024 })
  cohort_year?: number;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'GRADUATED', 'DROPPED'],
    example: 'GRADUATED',
  })
  status?: StudentStatus;
}
