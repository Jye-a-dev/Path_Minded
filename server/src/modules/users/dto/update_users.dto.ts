import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UserRole } from '../interfaces/users.interfaces';

export class UpdateUsersDto {
  @ApiPropertyOptional({ example: 'newmail@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'N3wP@ssw0rd' })
  password?: string;

  @ApiPropertyOptional({
    enum: ['STUDENT', 'ADVISOR', 'ADMIN'],
    example: 'ADVISOR',
  })
  role?: UserRole;
}
