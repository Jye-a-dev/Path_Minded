export type ProgramEntity = {
  id: string;
  program_code: string;
  program_name: string;
  major_name: string | null;
  version: string | null;
  total_credits: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ProgramResponse = {
  id: string;
  program_code: string;
  program_name: string;
  major_name: string | null;
  version: string | null;
  total_credits: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ProgramsPaginationResponse = {
  data: ProgramResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
