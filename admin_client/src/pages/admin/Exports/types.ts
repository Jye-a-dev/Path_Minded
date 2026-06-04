export interface MatrixPreviewData {
  classInfo: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    program_id: string;
  };
  programInfo: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    total_credits: number | null;
  };
  students: Array<{ id: string; student_code: string; full_name: string; advisor_feedback: string | null }>;
  courses: Array<{
    course_code: string;
    course_name: string;
    credits: number | null;
    theory_hours: number | null;
    practice_hours: number | null;
    project_hours: number | null;
    internship_hours: number | null;
    expected_semester: number | null;
    course_type: string;
    is_required: boolean;
    prerequisite: string | null;
    corequisite: string | null;
    organizing_semester: string | null;
    knowledge_block: string | null;
    course_group: string | null;
  }>;
  results: Array<{
    id?: string;
    student_id: string;
    course_code: string;
    status: string;
    semester_number: number | null;
    score_10: number | null;
    letter_grade: string | null;
    school_year?: string | null;
    semester_code?: string | null;
  }>;
}

export interface MatrixTableProps {
  classId: string;
  className?: string;
  onClose?: () => void;
  onDownload?: () => void;
  downloading?: boolean;
  isInline?: boolean;
}
