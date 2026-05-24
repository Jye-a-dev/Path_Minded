import type { UserRole } from '../../users/interfaces/users.interfaces';

export type AuthUserPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthLoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};
