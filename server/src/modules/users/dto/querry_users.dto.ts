import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UserRole } from '../interfaces/users.interfaces';

export class QuerryUsersDto {
  @ApiPropertyOptional({ example: 'example@gmail.com' })
  email?: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    example: 'STUDENT',
  })
  role?: UserRole;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  limit?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  offset?: number;
}
