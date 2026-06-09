export interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
}

export interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

export const MERGEABLE_FIELDS = [
  "expectedSemester",
  "organizingSemester",
  "credits",
  "theoryHours",
  "practiceHours",
  "projectHours",
  "internshipHours",
  "courseGroup",
  "courseType",
  "prerequisite",
  "corequisite",
  "knowledgeBlock",
] as const;

export type MergeableField = typeof MERGEABLE_FIELDS[number];

export const FIELD_LABELS: Record<MergeableField, string> = {
  expectedSemester: "Học kỳ dự kiến",
  organizingSemester: "Học kỳ tổ chức",
  credits: "Số tín chỉ",
  theoryHours: "Giờ lý thuyết",
  practiceHours: "Giờ thực hành",
  projectHours: "Giờ đồ án",
  internshipHours: "Giờ thực tập",
  courseGroup: "Nhóm môn học",
  courseType: "Loại môn học",
  prerequisite: "Môn tiên quyết",
  corequisite: "Môn song hành",
  knowledgeBlock: "Khối kiến thức",
};

export function isPopulated(field: string, val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed === "" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined" ||
      trimmed === "-" ||
      trimmed === "0" ||
      trimmed.toLowerCase() === "n/a"
    ) {
      return false;
    }
    if (field === "courseType" && trimmed === "OTHER") return false;
  }
  if (typeof val === "number") {
    if (isNaN(val)) return false;
    if ((field === "expectedSemester" || field === "organizingSemester") && val <= 0) {
      return false;
    }
  }
  return true;
}

export function getColumnCompleteness(coursesList: CoursePreviewItem[], field: MergeableField): number {
  if (coursesList.length === 0) return 0;
  let populatedCount = 0;
  for (const course of coursesList) {
    if (isPopulated(field, course[field])) {
      populatedCount++;
    }
  }
  return populatedCount / coursesList.length;
}

export function getMergedValue<T>(field: MergeableField, valY: T, valX: T, prioSource: boolean): T {
  const hasY = isPopulated(field, valY);
  const hasX = isPopulated(field, valX);
  if (prioSource) {
    return hasX ? valX : valY;
  } else {
    return hasY ? valY : valX;
  }
}

export function mergeCoursesList(
  targetList: CoursePreviewItem[],
  sourceList: CoursePreviewItem[]
): {
  nextCourses: CoursePreviewItem[];
  mergeCount: number;
  prioritizedFieldLabels: string[];
} {
  let mergeCount = 0;
  const prioritizeSourceFields: Record<string, boolean> = {};
  const prioritizedFieldLabels: string[] = [];

  MERGEABLE_FIELDS.forEach((field) => {
    const compY = getColumnCompleteness(targetList, field);
    const compX = getColumnCompleteness(sourceList, field);
    if (compX > compY) {
      prioritizeSourceFields[field] = true;
      prioritizedFieldLabels.push(FIELD_LABELS[field]);
    } else {
      prioritizeSourceFields[field] = false;
    }
  });

  const nextCourses = targetList.map((courseY) => {
    const matchingCourseX =
      sourceList.find(
        (courseX) =>
          courseX.courseCode.trim().toUpperCase() ===
            courseY.courseCode.trim().toUpperCase() &&
          courseX.courseType === courseY.courseType
      ) ||
      sourceList.find(
        (courseX) =>
          courseX.courseCode.trim().toUpperCase() ===
          courseY.courseCode.trim().toUpperCase()
      );

    if (matchingCourseX) {
      mergeCount++;
      return {
        ...courseY,
        expectedSemester: getMergedValue("expectedSemester", courseY.expectedSemester, matchingCourseX.expectedSemester, !!prioritizeSourceFields.expectedSemester),
        organizingSemester: getMergedValue("organizingSemester", courseY.organizingSemester, matchingCourseX.organizingSemester, !!prioritizeSourceFields.organizingSemester),
        credits: getMergedValue("credits", courseY.credits, matchingCourseX.credits, !!prioritizeSourceFields.credits),
        theoryHours: getMergedValue("theoryHours", courseY.theoryHours, matchingCourseX.theoryHours, !!prioritizeSourceFields.theoryHours),
        practiceHours: getMergedValue("practiceHours", courseY.practiceHours, matchingCourseX.practiceHours, !!prioritizeSourceFields.practiceHours),
        projectHours: getMergedValue("projectHours", courseY.projectHours, matchingCourseX.projectHours, !!prioritizeSourceFields.projectHours),
        internshipHours: getMergedValue("internshipHours", courseY.internshipHours, matchingCourseX.internshipHours, !!prioritizeSourceFields.internshipHours),
        courseGroup: getMergedValue("courseGroup", courseY.courseGroup, matchingCourseX.courseGroup, !!prioritizeSourceFields.courseGroup),
        courseType: getMergedValue("courseType", courseY.courseType, matchingCourseX.courseType, !!prioritizeSourceFields.courseType),
        prerequisite: getMergedValue("prerequisite", courseY.prerequisite, matchingCourseX.prerequisite, !!prioritizeSourceFields.prerequisite),
        corequisite: getMergedValue("corequisite", courseY.corequisite, matchingCourseX.corequisite, !!prioritizeSourceFields.corequisite),
        knowledgeBlock: getMergedValue("knowledgeBlock", courseY.knowledgeBlock, matchingCourseX.knowledgeBlock, !!prioritizeSourceFields.knowledgeBlock),
      };
    }
    return courseY;
  });

  return {
    nextCourses,
    mergeCount,
    prioritizedFieldLabels,
  };
}
