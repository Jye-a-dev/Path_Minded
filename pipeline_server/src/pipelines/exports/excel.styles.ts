import { Worksheet, Cell } from '@cj-tech-master/excelts';
import type { Alignment, Borders } from '@cj-tech-master/excelts';

export const HEADER_BORDER: Partial<Borders> = {
  top: { style: 'thin', color: { argb: 'FFBBBBBB' } },
  left: { style: 'thin', color: { argb: 'FFBBBBBB' } },
  bottom: { style: 'thin', color: { argb: 'FFBBBBBB' } },
  right: { style: 'thin', color: { argb: 'FFBBBBBB' } },
};

export const COURSE_BORDER: Partial<Borders> = {
  top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
  left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
  bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
  right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
};

export function styleCell(
  cell: Cell,
  bgHex?: string,
  textHex?: string,
  isBold: boolean = false,
  alignment?: Partial<Alignment>,
  border?: Partial<Borders>,
): void {
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
}

export function styleRange(
  ws: Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  bgHex?: string,
  textHex?: string,
  isBold: boolean = false,
  alignment?: Partial<Alignment>,
  border?: Partial<Borders>,
): void {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      styleCell(cell, bgHex, textHex, isBold, alignment, border);
    }
  }
}

export function setColumnWidths(ws: Worksheet, N: number): void {
  ws.getColumn(1).width = 6; // TT
  ws.getColumn(2).width = 15; // Mã HP
  ws.getColumn(3).width = 35; // Tên HP
  ws.getColumn(4).width = 6; // LT
  ws.getColumn(5).width = 6; // TH
  ws.getColumn(6).width = 6; // TT
  ws.getColumn(7).width = 12; // BB/TC
  ws.getColumn(8).width = 15; // ĐK
  ws.getColumn(9).width = 10; // HK tự chọn

  for (let i = 10; i <= 9 + N; i++) {
    ws.getColumn(i).width = 15;
  }
}
