import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateAdvisorsDto {
  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ example: 'Nguyen Van B' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: 'Data Science' })
  @IsOptional()
  @IsString()
  department?: string;
}
