import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProgramsDto {
  @ApiPropertyOptional({ example: 'SE2024' })
  @IsOptional()
  @IsString()
  program_code?: string;

  @ApiPropertyOptional({ example: 'Software Engineering Program Updated' })
  @IsOptional()
  @IsString()
  program_name?: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  major_name?: string;

  @ApiPropertyOptional({ example: '2024.1' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 160 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total_credits?: number;
}
