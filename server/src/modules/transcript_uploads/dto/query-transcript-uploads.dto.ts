import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryTranscriptUploadsDto extends BaseQueryDto {
  @ApiPropertyOptional({
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    example: 'PENDING',
  })
  @IsOptional()
  @IsString()
  parse_status?: string;

  @ApiPropertyOptional({ example: 'UUID' })
  @IsOptional()
  @IsString()
  student_id?: string;
}
