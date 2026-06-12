import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAdvisingLogDto {
  @ApiProperty({ example: '2e8205c7-f683-41fa-bfdb-fb531bf0999f' })
  @IsNotEmpty()
  @IsUUID()
  student_id: string;

  @ApiPropertyOptional({ example: '9df8ca89-38f4-4d95-a44b-cd91a461d413' })
  @IsOptional()
  @IsUUID()
  advisor_id?: string;

  @ApiPropertyOptional({ example: '3c8205c7-f683-41fa-bfdb-fb531bf0999e' })
  @IsOptional()
  @IsUUID()
  alert_id?: string;

  @ApiProperty({
    example:
      'Sinh viên hứa học kỳ tới sẽ cải thiện điểm số và trả nợ môn trượt.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
