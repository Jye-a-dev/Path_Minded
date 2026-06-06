export type ExportStudent = {
  id: string;
  studentCode: string;
  fullName: string;
  advisorFeedback?: string | null;
};

export type ExportCourse = {
  courseCode: string;
  courseName: string;
  credits: number | null;
  expectedSemester: number | null;
  courseGroup?: string | null;
  courseType?: string | null;
  knowledgeBlock?: string | null;
  isRequired?: boolean;
  theoryHours?: number | null;
  practiceHours?: number | null;
  projectHours?: number | null;
  internshipHours?: number | null;
  prerequisite?: string | null;
  corequisite?: string | null;
  organizingSemester?: string | null;
};

export type ExportCourseResult = {
  studentId: string;
  courseCode: string;
  status: 'PASSED' | 'FAILED' | 'STUDYING';
  semesterNumber: number | null;
  score10?: number | null;
  semesterCode?: string | null;
};

export type MatrixData = {
  students: ExportStudent[];
  courses: ExportCourse[];
  results?: ExportCourseResult[];
  pivotMap: Record<string, Record<string, string | number>>;
  stats: {
    successCount: number;
    warningCount: number;
  };
  classInfo?: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
  };
  programInfo?: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    total_credits: number | null;
  };
};
