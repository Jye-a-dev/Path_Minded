import { Worksheet } from '@cj-tech-master/excelts';
import type { MatrixData, ExportCourse } from './exports.types';
import {
  styleCell,
  styleRange,
  HEADER_BORDER,
  COURSE_BORDER,
} from './excel.styles';

export const KB_LABELS: Record<string, string> = {
  GENERAL: 'Kiến thức giáo dục đại cương',
  SECTOR_CORE: 'Kiến thức cơ sở khối ngành',
  MAJOR_CORE: 'Kiến thức cơ sở ngành',
  SPECIALIZED: 'Kiến thức chuyên ngành',
};

export const KB_COLORS: Record<string, string> = {
  GENERAL: 'FFD4EDDA', // #d4edda
  SECTOR_CORE: 'FFCCE5FF', // #cce5ff
  MAJOR_CORE: 'FFFFF3CD', // #fff3cd
  SPECIALIZED: 'FFF8D7DA', // #f8d7da
  OTHER: 'FFF5F5F5',
};

export function writeCourseRows(
  ws: Worksheet,
  data: MatrixData,
  N: number,
  startRow: number,
): number {
  // Group courses by knowledge block
  const groupedCourses: [string, ExportCourse[]][] = [];
  const groups = new Map<string, ExportCourse[]>();
  for (const c of data.courses) {
    const key = c.knowledgeBlock || 'OTHER';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  groupedCourses.push(...Array.from(groups.entries()));

  let currentRow = startRow;
  let courseIndex = 0;

  for (const [block, courses] of groupedCourses) {
    // Group header row
    ws.mergeCells(currentRow, 1, currentRow, 9 + N);
    styleRange(
      ws,
      currentRow,
      1,
      currentRow,
      9 + N,
      KB_COLORS[block] || 'FFF5F5F5',
      'FF000000',
      true,
      { vertical: 'middle', horizontal: 'left' },
      HEADER_BORDER,
    );
    ws.getCell(currentRow, 1).value = KB_LABELS[block] || block;
    currentRow++;

    // Course rows
    courses.forEach((course, idx) => {
      const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5'; // alternating rows
      const isRequired = course.isRequired || course.courseType === 'REQUIRED';

      // Column 1: Index
      const cell1 = ws.getCell(currentRow, 1);
      cell1.value = ++courseIndex;
      styleCell(
        cell1,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Column 2: Code
      const cell2 = ws.getCell(currentRow, 2);
      cell2.value = course.courseCode;
      styleCell(
        cell2,
        rowBg,
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'left' },
        COURSE_BORDER,
      );

      // Column 3: Name
      const cell3 = ws.getCell(currentRow, 3);
      cell3.value = course.courseName;
      styleCell(
        cell3,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'left', wrapText: true },
        COURSE_BORDER,
      );

      // Column 4: LT
      const cell4 = ws.getCell(currentRow, 4);
      cell4.value = course.theoryHours ?? course.credits ?? '';
      styleCell(
        cell4,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Column 5: TH
      const cell5 = ws.getCell(currentRow, 5);
      cell5.value = course.practiceHours ?? '';
      styleCell(
        cell5,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Column 6: TT (Internship)
      const cell6 = ws.getCell(currentRow, 6);
      cell6.value = course.internshipHours ?? '';
      styleCell(
        cell6,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Column 7: BB/TC
      const cell7 = ws.getCell(currentRow, 7);
      cell7.value = isRequired ? 'BB' : 'TC';
      styleCell(
        cell7,
        isRequired ? 'FFFFEBEE' : 'FFE8F5E9',
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Column 8: Prerequisite
      const cell8 = ws.getCell(currentRow, 8);
      cell8.value = course.corequisite || course.prerequisite || '';
      styleCell(
        cell8,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'left', wrapText: true },
        COURSE_BORDER,
      );

      // Column 9: Expected semester
      const cell9 = ws.getCell(currentRow, 9);
      cell9.value = course.expectedSemester ?? '';
      styleCell(
        cell9,
        rowBg,
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        COURSE_BORDER,
      );

      // Student cells
      data.students.forEach((student, studentIdx) => {
        const col = 10 + studentIdx;
        const cell = ws.getCell(currentRow, col);

        // Find result
        const result = data.results?.find(
          (r) =>
            r.studentId === student.id && r.courseCode === course.courseCode,
        );

        if (result) {
          if (result.status === 'PASSED') {
            cell.value = result.score10?.toString() ?? 'x';
            styleCell(
              cell,
              'FFE8F5E9',
              'FF2E7D32',
              true,
              { vertical: 'middle', horizontal: 'center' },
              COURSE_BORDER,
            );
          } else if (result.status === 'FAILED') {
            cell.value = result.score10?.toString() ?? 'o';
            styleCell(
              cell,
              'FFFFEBEE',
              'FFC62828',
              true,
              { vertical: 'middle', horizontal: 'center' },
              COURSE_BORDER,
            );
          } else if (result.status === 'STUDYING') {
            cell.value =
              (result.semesterCode || result.semesterNumber?.toString()) ?? 'y';
            styleCell(
              cell,
              'FFFFFDE7',
              'FFEF6C00',
              true,
              { vertical: 'middle', horizontal: 'center' },
              COURSE_BORDER,
            );
          }
        } else {
          cell.value = '';
          styleCell(
            cell,
            'FFFFFFFF',
            'FF000000',
            false,
            { vertical: 'middle', horizontal: 'center' },
            COURSE_BORDER,
          );
        }
      });

      currentRow++;
    });
  }

  return currentRow;
}
