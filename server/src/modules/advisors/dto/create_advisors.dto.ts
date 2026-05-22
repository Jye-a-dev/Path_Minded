import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdvisorsDto {
  @ApiProperty({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  user_id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  full_name: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  department?: string;
}
