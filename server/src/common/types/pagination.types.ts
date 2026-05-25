export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type FilterResult = {
  where: string;
  values: Array<string | number | boolean>;
  idx: number;
};
