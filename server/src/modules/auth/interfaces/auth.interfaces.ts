import type { UserRole } from '../../users/interfaces/users.interfaces';
import type { StringValue } from 'ms';

export type AuthUserPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number | StringValue;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

export type AuthLogoutResponse = {
  message: string;
};
