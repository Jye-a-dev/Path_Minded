import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { UserRole } from '../interfaces/users.interfaces';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryUsersDto extends BaseQueryDto {
  @ApiPropertyOptional({ example: 'example@gmail.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    example: 'STUDENT',
  })
  @IsOptional()
  @IsIn(['STUDENT', 'ADVISOR', 'ADMIN'])
  role?: UserRole;
}
