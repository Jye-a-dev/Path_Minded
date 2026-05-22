import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerryProgramsDto {
  @ApiPropertyOptional({ example: 'SE' })
  program_code?: string;

  @ApiPropertyOptional({ example: 'Software' })
  program_name?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  major_name?: string;

  @ApiPropertyOptional({ example: '2023.1' })
  version?: string;

  @ApiPropertyOptional({ example: 150 })
  total_credits?: number;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  offset?: number;
}
