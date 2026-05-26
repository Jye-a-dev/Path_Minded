import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryClassesDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'SE17' })
  @IsOptional()
  @IsString()
  class_code?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  class_name?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cohort_year?: number;

  @ApiPropertyOptional({ example: 'b2303a71-f0ad-4ffb-8ac2-c46087debcc9' })
  @IsOptional()
  @IsUUID()
  advisor_id?: string;

  @ApiPropertyOptional({ example: '5f74d7f7-ecbc-43fb-85b8-7d53ea06c622' })
  @IsOptional()
  @IsUUID()
  program_id?: string;
}
