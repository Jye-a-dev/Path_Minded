export type StudentStatus = 'ACTIVE' | 'GRADUATED' | 'DROPPED';

export type StudentEntity = {
  id: string;
  user_id: string | null;
  student_code: string;
  full_name: string;
  class_id: string | null;
  program_id: string | null;
  cohort_year: number | null;
  status: StudentStatus;
  email?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type StudentResponse = {
  id: string;
  user_id: string | null;
  student_code: string;
  full_name: string;
  class_id: string | null;
  program_id: string | null;
  cohort_year: number | null;
  status: StudentStatus;
  email: string | null;
  created_at: Date;
  updated_at: Date;
};

export type StudentsPaginationResponse = {
  data: StudentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
