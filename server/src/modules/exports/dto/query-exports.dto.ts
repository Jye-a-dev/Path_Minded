import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryExportsDto extends BaseQueryDto {
  @ApiPropertyOptional({ enum: ['MATRIX'], example: 'MATRIX' })
  @IsOptional()
  @IsString()
  export_type?: string;

  @ApiPropertyOptional({ example: 'UUID' })
  @IsOptional()
  @IsString()
  class_id?: string;
}
