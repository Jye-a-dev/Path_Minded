export type UserRole = 'STUDENT' | 'ADVISOR' | 'ADMIN';

export type MicrosoftProfile = {
  ms_id?: string | null;
  user_principal_name?: string | null;
  display_name?: string | null;
  given_name?: string | null;
  surname?: string | null;
  mail?: string | null;
  job_title?: string | null;
  mobile_phone?: string | null;
  business_phones?: string[] | null;
  office_location?: string | null;
  preferred_language?: string | null;
};

export type UserEntity = {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
} & MicrosoftProfile;

export type UserResponse = {
  id: string;
  email: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
} & MicrosoftProfile;

export type UsersPaginationResponse = {
  data: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
