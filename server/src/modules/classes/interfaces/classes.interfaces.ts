export type ClassEntity = {
  id: string;
  advisor_id: string | null;
  program_id: string | null;
  class_code: string;
  class_name: string | null;
  cohort_year: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ClassResponse = {
  id: string;
  advisor_id: string | null;
  program_id: string | null;
  class_code: string;
  class_name: string | null;
  cohort_year: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ClassesPaginationResponse = {
  data: ClassResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
