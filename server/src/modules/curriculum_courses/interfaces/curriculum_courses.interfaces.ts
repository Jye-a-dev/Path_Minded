export type CurriculumCourseEntity = {
  id: string;
  [key: string]: unknown;
};

export type CurriculumCourseResponse = CurriculumCourseEntity;

export type CurriculumCoursesPaginationResponse = {
  data: CurriculumCourseResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
