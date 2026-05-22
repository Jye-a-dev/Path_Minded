import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '../interfaces/users.interfaces';

export class CreateUsersDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  password: string;

  @ApiProperty({ enum: ['STUDENT', 'ADVISOR', 'ADMIN'], example: 'STUDENT' })
  role: UserRole;
}
