export interface CourseTypeMappingEntity {
  id: string;
  course_type: 'REQUIRED' | 'ELECTIVE' | 'PE' | 'ENGLISH' | 'DEFENSE' | 'OTHER';
  label: string;
  phrases: string[];
  created_at: Date;
  updated_at: Date;
}

export type CourseTypeMappingResponse = CourseTypeMappingEntity;
