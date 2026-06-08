import type { MatrixPreviewData } from "../types";
import { MatrixInfoLegend } from "./MatrixInfoLegend";
import { MatrixFeedbackRow } from "./MatrixFeedbackRow";

interface MatrixTableHeaderProps {
  matrixData: MatrixPreviewData;
  studentStatusMap: Map<string, { onTrack: boolean }>;
  handleFeedbackClick: (studentId: string, studentName: string, currentFeedback: string | null) => void;
}

export function MatrixTableHeader({
  matrixData,
  studentStatusMap,
  handleFeedbackClick,
}: MatrixTableHeaderProps) {
  return (
    <thead>
      {/* ── Row 1: Left details box + Right student_code ────────────────── */}
      <tr>
        <td
          colSpan={9}
          rowSpan={2}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #bbb",
            padding: "10px 12px",
            verticalAlign: "middle",
            minWidth: "480px",
            position: "sticky",
            left: 0,
            zIndex: 20,
          }}
        >
          <MatrixInfoLegend matrixData={matrixData} />
        </td>
        {/* Student MSSV columns */}
        {matrixData.students.map((s) => {
          const studentStatus = studentStatusMap.get(s.id);
          const headerBg = studentStatus?.onTrack ? "#fff59d" : "#ff8a80";
          const headerColor = "#000";
          return (
            <td
              key={s.id}
              style={{
                backgroundColor: headerBg,
                border: "1px solid #bbb",
                textAlign: "center",
                fontSize: "8.5px",
                color: headerColor,
                fontWeight: "800",
                padding: "8px 4px",
                width: "72px",
                minWidth: "72px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={s.full_name}
            >
              {s.student_code}
            </td>
          );
        })}
      </tr>

      {/* ── Row 2: Right student names ─────────────────────────────── */}
      <tr>
        {matrixData.students.map((s) => {
          const studentStatus = studentStatusMap.get(s.id);
          const headerBg = studentStatus?.onTrack ? "#fffde7" : "#ffebee";
          const headerColor = "#000";
          return (
            <td
              key={s.id}
              style={{
                backgroundColor: headerBg,
                border: "1px solid #bbb",
                textAlign: "center",
                fontSize: "9px",
                color: headerColor,
                fontWeight: "800",
                padding: "8px 4px",
                width: "72px",
                minWidth: "72px",
                overflow: "hidden",
                whiteSpace: "normal",
                wordBreak: "break-word",
              }}
              title={s.full_name}
            >
              {s.full_name}
            </td>
          );
        })}
      </tr>

      {/* ── Row 3: Advisor Feedback Row ─────────────────────────────── */}
      <MatrixFeedbackRow
        students={matrixData.students}
        onFeedbackClick={handleFeedbackClick}
      />

      {/* ── Row 4: Column headers ─────────────────────────────────── */}
      <tr style={{ backgroundColor: "#ffd54f" }}>
        {[
          { label: "TT", w: 28 },
          { label: "Mã học phần", w: 68 },
          { label: "Tên học phần / (Thi số tín chỉ)", w: 160 },
          { label: "LT", w: 28 },
          { label: "TH", w: 28 },
          { label: "TT", w: 28 },
          { label: "Bắt buộc/ Tự chọn", w: 44 },
          { label: "ĐK (học trước)", w: 60 },
          { label: "HK tự chọn lý thuyết", w: 52 },
        ].map((col, idx) => {
          const isSticky = idx < 3;
          const stickyLeft = idx === 0 ? 0 : idx === 1 ? 28 : idx === 2 ? 96 : undefined;
          return (
            <th
              key={col.label}
              style={{
                backgroundColor: "#ffd54f",
                border: "1px solid #bbb",
                textAlign: "center",
                fontWeight: "800",
                fontSize: "9px",
                color: "#000",
                padding: "4px 2px",
                width: `${col.w}px`,
                minWidth: `${col.w}px`,
                maxWidth: `${col.w}px`,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                position: isSticky ? "sticky" : undefined,
                left: stickyLeft,
                zIndex: isSticky ? 20 : undefined,
              }}
              title={col.label}
            >
              {col.label}
            </th>
          );
        })}
        {matrixData.students.map((_, i) => (
          <th
            key={i}
            style={{
              backgroundColor: "#ffd54f",
              border: "1px solid #bbb",
              textAlign: "center",
              fontWeight: "850",
              fontSize: "9px",
              color: "#000",
              padding: "4px 2px",
              width: "72px",
              minWidth: "72px",
            }}
          >
            {i + 1}
          </th>
        ))}
      </tr>
    </thead>
  );
}
