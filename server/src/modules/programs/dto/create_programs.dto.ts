import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProgramsDto {
  @ApiProperty({ example: 'SE2023' })
  program_code: string;

  @ApiProperty({ example: 'Software Engineering Program' })
  program_name: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  major_name?: string;

  @ApiPropertyOptional({ example: '2023.1' })
  version?: string;

  @ApiPropertyOptional({ example: 150 })
  total_credits?: number;
}
