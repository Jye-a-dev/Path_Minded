// curriculum-parser.types.ts
export type RawRow = {
  rowNumber: number;
  values: (string | number | null)[];
};

export interface TableHeaders {
  courseCodeIdx: number;
  courseNameIdx: number;
  creditsIdx: number;
  theoryHoursIdx: number;
  practiceHoursIdx: number;
  projectHoursIdx: number;
  internshipHoursIdx: number;
  semesterIdx: number;
  courseTypeIdx: number;
  knowledgeBlockIdx: number;
  prerequisiteIdx: number;
  corequisiteIdx: number;
  organizingSemesterIdx: number;
}
