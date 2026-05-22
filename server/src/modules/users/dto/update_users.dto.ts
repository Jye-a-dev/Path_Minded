import { UserRole } from '../interfaces/users.interfaces';

export class UpdateUsersDto {
  email?: string;
  password?: string;
  role?: UserRole;
}
