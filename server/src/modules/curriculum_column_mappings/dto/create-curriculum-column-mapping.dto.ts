import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCurriculumColumnMappingDto {
  @ApiProperty({ example: 'custom_field' })
  @IsString()
  field_key: string;

  @ApiProperty({ example: 'Trường tùy biến' })
  @IsString()
  display_label: string;

  @ApiProperty({ example: ['custom'] })
  @IsArray()
  @IsString({ each: true })
  phrases: string[];

  @ApiPropertyOptional({ example: 'CURRICULUM', enum: ['CURRICULUM', 'CLASS'] })
  @IsOptional()
  @IsIn(['CURRICULUM', 'CLASS'])
  mapping_type?: 'CURRICULUM' | 'CLASS';
}
