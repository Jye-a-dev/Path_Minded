export type StudentCourseResultEntity = {
  id: string;
  [key: string]: unknown;
};

export type StudentCourseResultResponse = StudentCourseResultEntity;

export type StudentCourseResultsPaginationResponse = {
  data: StudentCourseResultResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
