import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdvisorsDto {
  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  user_id?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van B' })
  full_name?: string;

  @ApiPropertyOptional({ example: 'Data Science' })
  department?: string;
}
