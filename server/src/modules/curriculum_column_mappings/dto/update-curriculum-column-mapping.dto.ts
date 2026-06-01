import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCurriculumColumnMappingDto {
  @ApiPropertyOptional({ example: 'Trường tùy biến mới' })
  @IsOptional()
  @IsString()
  display_label?: string;

  @ApiPropertyOptional({ example: ['custom_new'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phrases?: string[];

  @ApiPropertyOptional({ example: 'CURRICULUM', enum: ['CURRICULUM', 'CLASS'] })
  @IsOptional()
  @IsIn(['CURRICULUM', 'CLASS'])
  mapping_type?: 'CURRICULUM' | 'CLASS';
}
