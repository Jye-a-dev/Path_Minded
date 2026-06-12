export const CLASSIFICATIONS = [
  { label: "Xuất sắc", minGpa: 3.60, color: "text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/70" },
  { label: "Giỏi", minGpa: 3.20, color: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70" },
  { label: "Khá", minGpa: 2.50, color: "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/70" },
  { label: "Trung bình", minGpa: 2.00, color: "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/70" },
];

export const GRADE_VALUES: Record<string, number> = {
  "A+": 4.0,
  "A": 4.0,
  "B+": 3.5,
  "B": 3.0,
  "C+": 2.5,
  "C": 2.0,
  "D+": 1.5,
  "D": 1.0,
  "F": 0.0,
};

export interface StudentProfile {
  id: string;
  student_code: string;
  full_name: string;
  program_id?: string;
  cohort_year?: number;
}

export interface CurriculumCourse {
  course_code: string;
  course_name: string;
  credits: number;
  expected_semester: number;
  knowledge_block: string;
  is_required: boolean;
  course_type?: string;
}

export interface CourseResult {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  score_4: number | null;
  status: "PASSED" | "FAILED" | "STUDYING" | "NOT_STARTED";
  expected_semester?: number;
  course_type?: string;
}

export interface PrerequisiteRule {
  course_code: string;
  prerequisite_course_code: string;
  prerequisite_type?: string;
}
