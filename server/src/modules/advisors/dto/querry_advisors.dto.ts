import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerryAdvisorsDto {
  @ApiPropertyOptional({ example: 'Nguyen' })
  full_name?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  department?: string;

  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  user_id?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  offset?: number;
}
