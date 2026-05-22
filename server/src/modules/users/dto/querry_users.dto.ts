import { UserRole } from '../interfaces/users.interfaces';

export class QuerryUsersDto {
  email?: string;
  role?: UserRole;
  limit?: number;
  offset?: number;
}
