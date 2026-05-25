import { Injectable, Logger } from '@nestjs/common';
import { Workbook } from '@cj-tech-master/excelts';
import type { MatrixData } from './exports.types';

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

    // Header row
    const headers = [
      'No.',
      'Course Code',
      'Course Name',
      'Credits',
      'Semester',
    ];
    for (const student of data.students) {
      headers.push(`${student.studentCode} - ${student.fullName}`);
    }
    ws.addRow(headers);

    // Data rows
    let rowIdx = 1;
    for (const course of data.courses) {
      const row = [
        rowIdx++,
        course.courseCode,
        course.courseName,
        course.credits,
        course.expectedSemester,
      ];

      for (const student of data.students) {
        const val = data.pivotMap[student.id][course.courseCode] || '';
        row.push(val);
      }
      ws.addRow(row);
    }

    return (await wb.xlsx.writeBuffer()) as Buffer;
  }
}
