export type ExportLogEntity = {
  id: string;
  [key: string]: unknown;
};

export type ExportLogResponse = ExportLogEntity;

export type ExportLogsPaginationResponse = {
  data: ExportLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

