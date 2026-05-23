export type CoursePrerequisiteEntity = {
  id: string;
  [key: string]: unknown;
};

export type CoursePrerequisiteResponse = CoursePrerequisiteEntity;

export type CoursePrerequisitesPaginationResponse = {
  data: CoursePrerequisiteResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
