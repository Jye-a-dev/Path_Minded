export type UserRole = 'STUDENT' | 'ADVISOR' | 'ADMIN';

export type UserEntity = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
};

export type UserResponse = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
};
