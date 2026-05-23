export type ClassImportRowEntity = {
  id: string;
  [key: string]: unknown;
};

export type ClassImportRowResponse = ClassImportRowEntity;

export type ClassImportRowsPaginationResponse = {
  data: ClassImportRowResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

