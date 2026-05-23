export type ExportEntity = {
  id: string;
  [key: string]: unknown;
};

export type ExportResponse = ExportEntity;

export type ExportsPaginationResponse = {
  data: ExportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

