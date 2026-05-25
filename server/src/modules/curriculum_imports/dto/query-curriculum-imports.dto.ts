import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryCurriculumImportsDto extends BaseQueryDto {
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
  program_id?: string;
}
