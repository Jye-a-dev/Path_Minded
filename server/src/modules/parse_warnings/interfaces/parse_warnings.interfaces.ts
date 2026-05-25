export type ParseWarningEntity = {
  id: string;
  [key: string]: unknown;
};

export type ParseWarningResponse = ParseWarningEntity;

export type ParseWarningsPaginationResponse = {
  data: ParseWarningResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
