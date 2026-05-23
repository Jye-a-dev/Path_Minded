export type CourseEquivalencyEntity = {
  id: string;
  [key: string]: unknown;
};

export type CourseEquivalencyResponse = CourseEquivalencyEntity;

export type CourseEquivalenciesPaginationResponse = {
  data: CourseEquivalencyResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
