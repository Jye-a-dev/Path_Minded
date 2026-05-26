import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAdvisorsDto {
  @ApiProperty({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  full_name: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  department?: string;
}
