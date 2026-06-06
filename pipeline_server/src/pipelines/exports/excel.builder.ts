import { Injectable, Logger } from '@nestjs/common';
import { Workbook, Worksheet } from '@cj-tech-master/excelts';
import type { MatrixData } from './exports.types';
import {
  setColumnWidths,
  styleCell,
  styleRange,
  HEADER_BORDER,
} from './excel.styles';
import { writeCourseRows } from './excel.courses';

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

    setColumnWidths(ws, N);
    this.writeLegendAndStudentHeaders(ws, data);
    this.writeAdvisorFeedbackRow(ws, data);
    this.writeColumnHeaders(ws, data);

    const nextRow = writeCourseRows(ws, data, N, 5);
    this.writeFooterLegend(ws, nextRow, N);

    return (await wb.xlsx.writeBuffer()) as Buffer;
  }

  private writeLegendAndStudentHeaders(ws: Worksheet, data: MatrixData): void {
    // Row 1 & 2: Legend and Student Header
    // Merge legend regions
    ws.mergeCells('A1:C2');
    styleRange(
      ws,
      1,
      1,
      2,
      3,
      'FFFFFFFF',
      undefined,
      true,
      { vertical: 'middle', horizontal: 'left', wrapText: true },
      HEADER_BORDER,
    );
    ws.getCell('A1').value =
      `TÊN CTDT - KHOÁ\nLớp: ${data.classInfo?.class_name || data.classInfo?.class_code || '—'}\nMã lớp: ${data.classInfo?.class_code || '—'}\nNiên khóa: ${data.classInfo?.cohort_year ?? '—'}`;

    ws.mergeCells('D1:F2');
    styleRange(
      ws,
      1,
      4,
      2,
      6,
      'FFFFFFFF',
      undefined,
      true,
      { vertical: 'middle', horizontal: 'left', wrapText: true },
      HEADER_BORDER,
    );
    ws.getCell('D1').value =
      `TỐT NGHIỆP: Đúng hạn (Vàng) | Nguy cơ trễ (Đỏ)\nMÔN HỌC:\nx = Đạt (Xanh)\no = Rớt (Đỏ)\nsố = Học kỳ học (Vàng)`;

    ws.mergeCells('G1:I2');
    styleRange(
      ws,
      1,
      7,
      2,
      9,
      'FFFFFFFF',
      undefined,
      true,
      { vertical: 'middle', horizontal: 'left', wrapText: true },
      HEADER_BORDER,
    );
    ws.getCell('G1').value =
      `Kế hoạch học tập\n${data.programInfo?.total_credits ?? '—'} Tín chỉ\nMã CT: ${data.programInfo?.program_code || '—'}\nNgành: ${data.programInfo?.major_name || '—'}`;

    // Compute onTrack status for students
    const studentStatusMap = new Map<string, { onTrack: boolean }>();
    for (const student of data.students) {
      const studentResults =
        data.results?.filter((r) => r.studentId === student.id) || [];
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
      styleCell(
        codeCell,
        isOk ? 'FFFFF59D' : 'FFFF8A80',
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'center' },
        HEADER_BORDER,
      );

      // Student name (Row 2)
      const nameCell = ws.getCell(2, col);
      nameCell.value = student.fullName;
      styleCell(
        nameCell,
        isOk ? 'FFFFFDE7' : 'FFFFEBEE',
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'center', wrapText: true },
        HEADER_BORDER,
      );
    });
  }

  private writeAdvisorFeedbackRow(ws: Worksheet, data: MatrixData): void {
    // Row 3: Advisor Feedback Row
    ws.mergeCells('A3:I3');
    styleRange(
      ws,
      3,
      1,
      3,
      9,
      'FFE8EAF6',
      'FF000000',
      true,
      { vertical: 'middle', horizontal: 'left' },
      HEADER_BORDER,
    );
    ws.getCell('A3').value = 'Ý kiến feedback của GVHT';

    data.students.forEach((student, idx) => {
      const col = 10 + idx;
      const fbCell = ws.getCell(3, col);
      fbCell.value = student.advisorFeedback || '—';
      styleCell(
        fbCell,
        'FFF5F5F5',
        'FF000000',
        false,
        { vertical: 'middle', horizontal: 'center' },
        HEADER_BORDER,
      );
    });
  }

  private writeColumnHeaders(ws: Worksheet, data: MatrixData): void {
    // Row 4: Column headers
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
      styleCell(
        cell,
        'FFFFD54F',
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'center', wrapText: true },
        HEADER_BORDER,
      );
    });

    data.students.forEach((_, idx) => {
      const col = 10 + idx;
      const cell = ws.getCell(4, col);
      cell.value = idx + 1;
      styleCell(
        cell,
        'FFFFD54F',
        'FF000000',
        true,
        { vertical: 'middle', horizontal: 'center' },
        HEADER_BORDER,
      );
    });
  }

  private writeFooterLegend(ws: Worksheet, row: number, N: number): void {
    ws.mergeCells(row, 1, row, 9 + N);
    styleRange(
      ws,
      row,
      1,
      row,
      9 + N,
      'FFF5F5F5',
      'FF000000',
      true,
      { vertical: 'middle', horizontal: 'left' },
      HEADER_BORDER,
    );
    ws.getCell(row, 1).value =
      'Ghi chú: x = Đã qua | o = Trượt | số = Học kỳ đang học (STUDYING) | trống = Chưa có dữ liệu';
  }
}
