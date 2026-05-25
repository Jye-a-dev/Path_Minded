import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateProgramsDto {
  @ApiProperty({ example: 'SE2023' })
  @IsString()
  program_code: string;

  @ApiProperty({ example: 'Software Engineering Program' })
  @IsString()
  program_name: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  major_name?: string;

  @ApiPropertyOptional({ example: '2023.1' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  total_credits?: number;
}
