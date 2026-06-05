import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type { MatrixData, ExportCourse } from './exports.types';

/**
 * Builds Excel buffer from MatrixData.
 */
@Injectable()
export class ExcelBuilder {
  private readonly logger = new Logger(ExcelBuilder.name);

  async buildMatrixExcel(data: MatrixData): Promise<Buffer> {
    this.logger.log('Building Excel workbook');

    const wb = new Workbook();
    const ws = wb.addWorksheet('Matrix');

    const N = data.students.length;

    // Define standard border styles
    const headerBorder = {
      top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
      right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
    };

    const courseBorder = {
      top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
    };

    // Helper functions for styling
    const styleCell = (
      cell: any,
      bgHex?: string,
      textHex?: string,
      isBold: boolean = false,
      alignment?: any,
      border?: any,
    ) => {
      if (bgHex) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgHex },
        };
      }
      cell.font = {
        name: 'Calibri',
        size: 9,
        bold: isBold,
        color: textHex ? { argb: textHex } : undefined,
      };
      if (alignment) {
        cell.alignment = alignment;
      }
      if (border) {
        cell.border = border;
      }
    };

    const styleRange = (
      ws: any,
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      bgHex?: string,
      textHex?: string,
      isBold: boolean = false,
      alignment?: any,
      border?: any,
    ) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = ws.getCell(r, c);
          styleCell(cell, bgHex, textHex, isBold, alignment, border);
        }
      }
    };

    // Set Column Widths
    ws.getColumn(1).width = 6;   // TT
    ws.getColumn(2).width = 15;  // Mã HP
    ws.getColumn(3).width = 35;  // Tên HP
    ws.getColumn(4).width = 6;   // LT
    ws.getColumn(5).width = 6;   // TH
    ws.getColumn(6).width = 6;   // TT
    ws.getColumn(7).width = 12;  // BB/TC
    ws.getColumn(8).width = 15;  // ĐK
    ws.getColumn(9).width = 10;  // HK tự chọn

    for (let i = 10; i <= 9 + N; i++) {
      ws.getColumn(i).width = 15;
    }

    // ── Row 1 & 2: Legend and Student Header ──
    // Merge legend regions
    ws.mergeCells('A1:C2');
    styleRange(ws, 1, 1, 2, 3, 'FFFFFFFF', undefined, true, { vertical: 'middle', horizontal: 'left', wrapText: true }, headerBorder);
    ws.getCell('A1').value = `TÊN CTDT - KHOÁ\nLớp: ${data.classInfo?.class_name || data.classInfo?.class_code || '—'}\nMã lớp: ${data.classInfo?.class_code || '—'}\nNiên khóa: ${data.classInfo?.cohort_year ?? '—'}`;

    ws.mergeCells('D1:F2');
    styleRange(ws, 1, 4, 2, 6, 'FFFFFFFF', undefined, true, { vertical: 'middle', horizontal: 'left', wrapText: true }, headerBorder);
    ws.getCell('D1').value = `TỐT NGHIỆP: Đúng hạn (Vàng) | Nguy cơ trễ (Đỏ)\nMÔN HỌC:\nx = Đạt (Xanh)\no = Rớt (Đỏ)\nsố = Học kỳ học (Vàng)`;

    ws.mergeCells('G1:I2');
    styleRange(ws, 1, 7, 2, 9, 'FFFFFFFF', undefined, true, { vertical: 'middle', horizontal: 'left', wrapText: true }, headerBorder);
    ws.getCell('G1').value = `Kế hoạch học tập\n${data.programInfo?.total_credits ?? '—'} Tín chỉ\nMã CT: ${data.programInfo?.program_code || '—'}\nNgành: ${data.programInfo?.major_name || '—'}`;

    // Compute onTrack status for students
    const studentStatusMap = new Map<string, { onTrack: boolean }>();
    for (const student of data.students) {
      const studentResults = data.results?.filter((r) => r.studentId === student.id) || [];
      const failedCourses = new Set<string>();
      const passedCourses = new Set<string>();
      
      for (const r of studentResults) {
        if (r.status === 'PASSED') {
          passedCourses.add(r.courseCode);
          failedCourses.delete(r.courseCode);
        } else if (r.status === 'FAILED') {
          if (!passedCourses.has(r.courseCode)) {
            failedCourses.add(r.courseCode);
          }
        }
      }
      const onTrack = failedCourses.size === 0;
      studentStatusMap.set(student.id, { onTrack });
    }

    // Populate student codes and names
    data.students.forEach((student, idx) => {
      const col = 10 + idx;
      const status = studentStatusMap.get(student.id);
      const isOk = status?.onTrack ?? true;

      // Student code (Row 1)
      const codeCell = ws.getCell(1, col);
      codeCell.value = student.studentCode;
      styleCell(codeCell, isOk ? 'FFFFF59D' : 'FFFF8A80', 'FF000000', true, { vertical: 'middle', horizontal: 'center' }, headerBorder);

      // Student name (Row 2)
      const nameCell = ws.getCell(2, col);
      nameCell.value = student.fullName;
      styleCell(nameCell, isOk ? 'FFFFFDE7' : 'FFFFEBEE', 'FF000000', true, { vertical: 'middle', horizontal: 'center', wrapText: true }, headerBorder);
    });

    // ── Row 3: Advisor Feedback Row ──
    ws.mergeCells('A3:I3');
    styleRange(ws, 3, 1, 3, 9, 'FFE8EAF6', 'FF000000', true, { vertical: 'middle', horizontal: 'left' }, headerBorder);
    ws.getCell('A3').value = 'Ý kiến feedback của GVHT';

    data.students.forEach((student, idx) => {
      const col = 10 + idx;
      const fbCell = ws.getCell(3, col);
      fbCell.value = student.advisorFeedback || '—';
      styleCell(fbCell, 'FFF5F5F5', 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, headerBorder);
    });

    // ── Row 4: Column headers ──
    const colLabels = [
      'TT',
      'Mã học phần',
      'Tên học phần / (Thi số tín chỉ)',
      'LT',
      'TH',
      'TT',
      'Bắt buộc/ Tự chọn',
      'ĐK (học trước)',
      'HK tự chọn lý thuyết',
    ];

    colLabels.forEach((label, idx) => {
      const col = idx + 1;
      const cell = ws.getCell(4, col);
      cell.value = label;
      styleCell(cell, 'FFFFD54F', 'FF000000', true, { vertical: 'middle', horizontal: 'center', wrapText: true }, headerBorder);
    });

    data.students.forEach((_, idx) => {
      const col = 10 + idx;
      const cell = ws.getCell(4, col);
      cell.value = idx + 1;
      styleCell(cell, 'FFFFD54F', 'FF000000', true, { vertical: 'middle', horizontal: 'center' }, headerBorder);
    });

    // ── Row 5+: Group headers and course rows ──
    // Group courses by knowledge block
    const groupedCourses: [string, ExportCourse[]][] = [];
    const groups = new Map<string, ExportCourse[]>();
    for (const c of data.courses) {
      const key = c.knowledgeBlock || 'OTHER';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    groupedCourses.push(...Array.from(groups.entries()));

    const KB_LABELS: Record<string, string> = {
      GENERAL: "Kiến thức giáo dục đại cương",
      SECTOR_CORE: "Kiến thức cơ sở khối ngành",
      MAJOR_CORE: "Kiến thức cơ sở ngành",
      SPECIALIZED: "Kiến thức chuyên ngành",
    };

    const KB_COLORS: Record<string, string> = {
      GENERAL:     'FFD4EDDA', // #d4edda
      SECTOR_CORE: 'FFCCE5FF', // #cce5ff
      MAJOR_CORE:  'FFFFF3CD', // #fff3cd
      SPECIALIZED: 'FFF8D7DA', // #f8d7da
      OTHER:       'FFF5F5F5',
    };

    let currentRow = 5;
    let courseIndex = 0;

    for (const [block, courses] of groupedCourses) {
      // Group header row
      ws.mergeCells(currentRow, 1, currentRow, 9 + N);
      styleRange(ws, currentRow, 1, currentRow, 9 + N, KB_COLORS[block] || 'FFF5F5F5', 'FF000000', true, { vertical: 'middle', horizontal: 'left' }, headerBorder);
      ws.getCell(currentRow, 1).value = KB_LABELS[block] || block;
      currentRow++;

      // Course rows
      courses.forEach((course, idx) => {
        const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5'; // alternating rows
        const isRequired = course.isRequired || course.courseType === 'REQUIRED';

        // Column 1: Index
        const cell1 = ws.getCell(currentRow, 1);
        cell1.value = ++courseIndex;
        styleCell(cell1, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Column 2: Code
        const cell2 = ws.getCell(currentRow, 2);
        cell2.value = course.courseCode;
        styleCell(cell2, rowBg, 'FF000000', true, { vertical: 'middle', horizontal: 'left' }, courseBorder);

        // Column 3: Name
        const cell3 = ws.getCell(currentRow, 3);
        cell3.value = course.courseName;
        styleCell(cell3, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'left', wrapText: true }, courseBorder);

        // Column 4: LT
        const cell4 = ws.getCell(currentRow, 4);
        cell4.value = course.theoryHours ?? course.credits ?? '';
        styleCell(cell4, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Column 5: TH
        const cell5 = ws.getCell(currentRow, 5);
        cell5.value = course.practiceHours ?? '';
        styleCell(cell5, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Column 6: TT (Internship)
        const cell6 = ws.getCell(currentRow, 6);
        cell6.value = course.internshipHours ?? '';
        styleCell(cell6, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Column 7: BB/TC
        const cell7 = ws.getCell(currentRow, 7);
        cell7.value = isRequired ? 'BB' : 'TC';
        styleCell(cell7, isRequired ? 'FFFFEBEE' : 'FFE8F5E9', 'FF000000', true, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Column 8: Prerequisite
        const cell8 = ws.getCell(currentRow, 8);
        cell8.value = course.corequisite || course.prerequisite || '';
        styleCell(cell8, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'left', wrapText: true }, courseBorder);

        // Column 9: Expected semester
        const cell9 = ws.getCell(currentRow, 9);
        cell9.value = course.expectedSemester ?? '';
        styleCell(cell9, rowBg, 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);

        // Student cells
        data.students.forEach((student, studentIdx) => {
          const col = 10 + studentIdx;
          const cell = ws.getCell(currentRow, col);

          // Find result
          const result = data.results?.find((r) => r.studentId === student.id && r.courseCode === course.courseCode);
          
          if (result) {
            if (result.status === 'PASSED') {
              cell.value = result.score10?.toString() ?? 'x';
              styleCell(cell, 'FFE8F5E9', 'FF2E7D32', true, { vertical: 'middle', horizontal: 'center' }, courseBorder);
            } else if (result.status === 'FAILED') {
              cell.value = result.score10?.toString() ?? 'o';
              styleCell(cell, 'FFFFEBEE', 'FFC62828', true, { vertical: 'middle', horizontal: 'center' }, courseBorder);
            } else if (result.status === 'STUDYING') {
              cell.value = (result.semesterCode || result.semesterNumber?.toString()) ?? 'y';
              styleCell(cell, 'FFFFFDE7', 'FFEF6C00', true, { vertical: 'middle', horizontal: 'center' }, courseBorder);
            }
          } else {
            cell.value = '';
            styleCell(cell, 'FFFFFFFF', 'FF000000', false, { vertical: 'middle', horizontal: 'center' }, courseBorder);
          }
        });

        currentRow++;
      });
    }

    // ── Row Footer: Legend note ──
    ws.mergeCells(currentRow, 1, currentRow, 9 + N);
    styleRange(ws, currentRow, 1, currentRow, 9 + N, 'FFF5F5F5', 'FF000000', true, { vertical: 'middle', horizontal: 'left' }, headerBorder);
    ws.getCell(currentRow, 1).value = 'Ghi chú: x = Đã qua | o = Trượt | số = Học kỳ đang học (STUDYING) | trống = Chưa có dữ liệu';

    return (await wb.xlsx.writeBuffer()) as Buffer;
  }
}
