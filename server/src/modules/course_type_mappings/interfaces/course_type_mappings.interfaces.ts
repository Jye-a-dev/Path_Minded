export interface CourseTypeMappingEntity {
  id: string;
  course_type: string;
  label: string;
  phrases: string[];
  created_at: Date;
  updated_at: Date;
}

export type CourseTypeMappingResponse = CourseTypeMappingEntity;
