import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerryClassesDto {
  @ApiPropertyOptional({ example: 'SE17' })
  class_code?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  class_name?: string;

  @ApiPropertyOptional({ example: 2023 })
  cohort_year?: number;

  @ApiPropertyOptional({ example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9' })
  advisor_id?: string;

  @ApiPropertyOptional({ example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  program_id?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  offset?: number;
}
