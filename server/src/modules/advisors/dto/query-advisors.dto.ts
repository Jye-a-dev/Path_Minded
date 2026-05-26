import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryAdvisorsDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'Nguyen' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
