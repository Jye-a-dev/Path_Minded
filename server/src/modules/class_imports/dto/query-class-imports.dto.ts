import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryClassImportsDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  import_status?: string;

  @ApiPropertyOptional({ example: 'UUID' })
  @IsOptional()
  @IsString()
  class_id?: string;

  @ApiPropertyOptional({ example: 'UUID' })
  @IsOptional()
  @IsString()
  program_id?: string;

  @ApiPropertyOptional({ example: 'Software Engineering' })
  @IsOptional()
  @IsString()
  major_name?: string;
}
