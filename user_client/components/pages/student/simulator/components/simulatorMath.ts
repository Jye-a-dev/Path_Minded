import { CurriculumCourse, PrerequisiteRule } from "./types";

/**
 * Checks if a course is a Physical Education (GDTC) course.
 */
export const isPeCourse = (
  courseCode: string,
  courseName: string,
  curriculum: CurriculumCourse[]
): boolean => {
  const cc = curriculum.find((c) => c.course_code === courseCode);
  if (cc?.course_type === "PE") return true;

  const lowerName = courseName.toLowerCase();
  const lowerCode = courseCode.toLowerCase();
  return (
    lowerName.includes("thể chất") ||
    lowerName.includes("gdtc") ||
    lowerName.includes("võ thuật") ||
    lowerName.includes("cờ vua") ||
    lowerName.includes("cờ tướng") ||
    lowerCode.includes("gdtc") ||
    lowerCode.includes("pema") ||
    lowerCode.includes("pekc")
  );
};

/**
 * Checks if a course is a National Defense (GDQP) course.
 */
export const isDefenseCourse = (
  courseCode: string,
  courseName: string,
  curriculum: CurriculumCourse[]
): boolean => {
  const cc = curriculum.find((c) => c.course_code === courseCode);
  if (cc?.course_type === "DEFENSE") return true;

  const lowerName = courseName.toLowerCase();
  const lowerCode = courseCode.toLowerCase();
  return (
    lowerName.includes("quốc phòng") ||
    lowerName.includes("quân sự") ||
    lowerName.includes("gdqp") ||
    lowerCode.includes("gdqp") ||
    lowerCode.includes("nad")
  );
};

/**
 * Checks if a course is a Physical Education (GDTC) or National Defense (GDQP) course.
 * According to regulations, these do not count towards GPA or graduation credits.
 */
export const isPeOrDefenseCourse = (
  courseCode: string,
  courseName: string,
  curriculum: CurriculumCourse[]
): boolean => {
  return (
    isPeCourse(courseCode, courseName, curriculum) ||
    isDefenseCourse(courseCode, courseName, curriculum)
  );
};

/**
 * Checks if a course is an English prep course (e.g., AV0) which should be excluded.
 */
export const isPrepEnglishCourse = (
  courseCode: string,
  courseName: string
): boolean => {
  const lowerCode = courseCode.toLowerCase();
  const lowerName = courseName.toLowerCase();
  return (
    lowerCode === "av0" ||
    lowerCode === "av00" ||
    lowerCode.startsWith("av0") ||
    lowerCode.includes("eng010012") ||
    lowerName.includes("dự bị") ||
    lowerName.includes("av0")
  );
};

interface SemesterCourseItem {
  course: CurriculumCourse;
  isAffected: boolean;
  isFailed: boolean;
  originalSem: number;
}

interface SemesterGroup {
  number: number;
  courses: SemesterCourseItem[];
}

interface SimulatedRoadmapResult {
  semestersList: SemesterGroup[];
  delayAmount: number;
  originalMaxSem: number;
  newMaxSem: number;
  affectedCount: number;
  dependencyChain: string[];
  affectedCourses: { course_code: string; course_name: string; delay: number }[];
}

export function computeSimulatedRoadmap(
  curriculum: CurriculumCourse[],
  prereqs: PrerequisiteRule[],
  selectedCourseToFail: string,
  retakeDelaySemesters: number,
  isDelaySimulated: boolean
): SimulatedRoadmapResult | null {
  if (curriculum.length === 0) return null;

  // 1. Build original expected semesters for all courses
  const originalSemesters: Record<string, number> = {};
  const courseMap: Record<string, CurriculumCourse> = {};

  curriculum.forEach((c) => {
    originalSemesters[c.course_code] = c.expected_semester;
    courseMap[c.course_code] = c;
  });

  // 2. Build graph maps
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};

  curriculum.forEach((c) => {
    childrenOf[c.course_code] = [];
    parentsOf[c.course_code] = [];
  });

  prereqs.forEach((r) => {
    // PREVIOUS and RECOMMENDED prerequisites do not propagate delay warnings
    if (r.prerequisite_type === "PREVIOUS" || r.prerequisite_type === "RECOMMENDED") {
      return;
    }
    if (childrenOf[r.prerequisite_course_code] && childrenOf[r.course_code]) {
      childrenOf[r.prerequisite_course_code].push(r.course_code);
      parentsOf[r.course_code].push(r.prerequisite_course_code);
    }
  });

  // 3. Setup scheduled semesters map initialized to original semesters
  const scheduledSemesters = { ...originalSemesters };
  const affectedCourses = new Set<string>();

  if (isDelaySimulated && selectedCourseToFail) {
    affectedCourses.add(selectedCourseToFail);

    const baseSem = originalSemesters[selectedCourseToFail] ?? 1;
    scheduledSemesters[selectedCourseToFail] = baseSem + retakeDelaySemesters;

    // BFS relaxation
    const queue = [selectedCourseToFail];
    const inQueue = new Set([selectedCourseToFail]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      inQueue.delete(curr);

      const currSem = scheduledSemesters[curr];
      const children = childrenOf[curr] ?? [];

      children.forEach((child) => {
        const minChildSem = currSem + 1;
        if (minChildSem > scheduledSemesters[child]) {
          scheduledSemesters[child] = minChildSem;
          affectedCourses.add(child);

          if (!inQueue.has(child)) {
            queue.push(child);
            inQueue.add(child);
          }
        }
      });
    }
  }

  // Group courses by their new semesters
  const maxSem = Math.max(8, ...Object.values(scheduledSemesters));
  const semestersList = [];

  for (let sem = 1; sem <= maxSem; sem++) {
    const coursesInSem = Object.entries(scheduledSemesters)
      .filter(([, s]) => s === sem)
      .map(([code]) => {
        const isFailed = code === selectedCourseToFail;
        return {
          course: courseMap[code],
          isAffected: affectedCourses.has(code) && !isFailed,
          isFailed,
          originalSem: originalSemesters[code] ?? sem,
        };
      });

    if (coursesInSem.length > 0 || sem <= 8) {
      semestersList.push({
        number: sem,
        courses: coursesInSem,
      });
    }
  }

  const origMaxSem = Math.max(8, ...curriculum.map((c) => c.expected_semester));
  const delayAmount = Math.max(0, maxSem - origMaxSem);

  // Trace dependency chain for display
  const dependencyChain: string[] = [];
  if (isDelaySimulated && selectedCourseToFail) {
    dependencyChain.push(selectedCourseToFail);
    let current = selectedCourseToFail;
    while (true) {
      const children = childrenOf[current] ?? [];
      const affectedChild = children.find(
        (c) => affectedCourses.has(c) && scheduledSemesters[c] > originalSemesters[c]
      );
      if (affectedChild) {
        dependencyChain.push(affectedChild);
        current = affectedChild;
      } else {
        break;
      }
    }
  }

  // Trace affected courses detailed delays list
  const affectedCoursesList: { course_code: string; course_name: string; delay: number }[] = [];
  if (isDelaySimulated && selectedCourseToFail) {
    affectedCourses.forEach((code) => {
      if (code !== selectedCourseToFail) {
        const origSem = originalSemesters[code] ?? 1;
        const newSem = scheduledSemesters[code] ?? 1;
        const delay = newSem - origSem;
        if (delay > 0) {
          affectedCoursesList.push({
            course_code: code,
            course_name: courseMap[code]?.course_name || code,
            delay
          });
        }
      }
    });
  }

  return {
    semestersList,
    delayAmount,
    originalMaxSem: origMaxSem,
    newMaxSem: maxSem,
    affectedCount: affectedCourses.size - 1, // Exclude the failed course itself
    dependencyChain,
    affectedCourses: affectedCoursesList,
  };
}
