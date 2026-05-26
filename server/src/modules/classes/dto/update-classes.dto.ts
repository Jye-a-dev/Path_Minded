import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateClassesDto {
  @ApiPropertyOptional({ example: 'SE18A' })
  @IsOptional()
  @IsString()
  class_code?: string;

  @ApiPropertyOptional({ example: 'Software Engineering K18A' })
  @IsOptional()
  @IsString()
  class_name?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1900)
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
