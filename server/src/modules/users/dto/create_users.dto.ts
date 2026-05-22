import { UserRole } from '../interfaces/users.interfaces';

export class CreateUsersDto {
  email: string;
  password: string;
  role: UserRole;
}
