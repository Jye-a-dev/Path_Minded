export type ExportStudent = {
  id: string;
  studentCode: string;
  fullName: string;
};

export type ExportCourse = {
  courseCode: string;
  courseName: string;
  credits: number | null;
  expectedSemester: number | null;
};

export type ExportCourseResult = {
  studentId: string;
  courseCode: string;
  status: 'PASSED' | 'FAILED' | 'STUDYING';
  semesterNumber: number | null;
};

export type MatrixData = {
  students: ExportStudent[];
  courses: ExportCourse[];
  pivotMap: Record<string, Record<string, string | number>>;
  stats: {
    successCount: number;
    warningCount: number;
  };
};
