import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgramsDto {
  @ApiPropertyOptional({ example: 'SE2024' })
  program_code?: string;

  @ApiPropertyOptional({ example: 'Software Engineering Program Updated' })
  program_name?: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  major_name?: string;

  @ApiPropertyOptional({ example: '2024.1' })
  version?: string;

  @ApiPropertyOptional({ example: 160 })
  total_credits?: number;
}
