export type AdvisorEntity = {
  id: string;
  user_id: string;
  full_name: string;
  department: string | null;
  created_at: Date;
  updated_at: Date;
};

export type AdvisorResponse = {
  id: string;
  user_id: string;
  full_name: string;
  department: string | null;
  created_at: Date;
  updated_at: Date;
};

export type AdvisorsPaginationResponse = {
  data: AdvisorResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
