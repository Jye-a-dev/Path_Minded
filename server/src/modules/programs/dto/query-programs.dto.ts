import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryProgramsDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'SE' })
  @IsOptional()
  @IsString()
  program_code?: string;

  @ApiPropertyOptional({ example: 'Software' })
  @IsOptional()
  @IsString()
  program_name?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
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
