import React from "react";
import type { MatrixPreviewData } from "../types";
import { getCellValue, getCellStyle } from "../matrixUtils";

interface MatrixCourseRowProps {
  course: MatrixPreviewData["courses"][0];
  rowIdx: number;
  rowBg: string;
  students: MatrixPreviewData["students"];
  resultMap: Map<string, Map<string, MatrixPreviewData["results"][0]>>;
  onCellDoubleClick: (
    studentId: string,
    studentName: string,
    courseCode: string,
    courseName: string,
    result?: MatrixPreviewData["results"][0]
  ) => void;
}

export const MatrixCourseRow: React.FC<MatrixCourseRowProps> = ({
  course,
  rowIdx,
  rowBg,
  students,
  resultMap,
  onCellDoubleClick,
}) => {
  const isRequired = course.is_required || course.course_type === "REQUIRED";

  return (
    <tr style={{ backgroundColor: rowBg, color: "#000" }}>
      {/* TT */}
      <td
        style={{
          border: "1px solid #ddd",
          textAlign: "center",
          padding: "2px",
          fontSize: "9px",
          color: "#000",
          position: "sticky",
          left: 0,
          zIndex: 10,
          backgroundColor: rowBg,
        }}
      >
        {rowIdx}
      </td>
      {/* Mã học phần */}
      <td
        style={{
          border: "1px solid #ddd",
          padding: "2px 4px",
          fontSize: "9px",
          fontWeight: "700",
          color: "#000",
          position: "sticky",
          left: 28,
          zIndex: 10,
          backgroundColor: rowBg,
        }}
      >
        {course.course_code}
      </td>
      {/* Tên */}
      <td
        style={{
          border: "1px solid #ddd",
          padding: "2px 4px",
          fontSize: "9px",
          color: "#000",
          position: "sticky",
          left: 96,
          zIndex: 10,
          backgroundColor: rowBg,
        }}
      >
        {course.course_name}
      </td>
      {/* LT */}
      <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px", fontSize: "9px", color: "#000" }}>
        {course.theory_hours ?? course.credits ?? ""}
      </td>
      {/* TH */}
      <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px", fontSize: "9px", color: "#000" }}>
        {course.practice_hours ?? ""}
      </td>
      {/* TT */}
      <td style={{ border: "1px solid #ddd", textAlign: "center", padding: "2px", fontSize: "9px", color: "#000" }}>
        {course.internship_hours ?? ""}
      </td>
      {/* BB/TC */}
      <td
        style={{
          border: "1px solid #ddd",
          textAlign: "center",
          padding: "2px",
          fontSize: "9px",
          backgroundColor: isRequired ? "#ffebee" : "#e8f5e9",
          color: "#000",
          fontWeight: "800",
          maxWidth: "44px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={isRequired ? "Bắt buộc" : "Tự chọn"}
      >
        {isRequired ? "BB" : "TC"}
      </td>
      {/* ĐK học trước */}
      <td
        style={{
          border: "1px solid #ddd",
          padding: "2px 3px",
          fontSize: "8px",
          color: "#000",
          maxWidth: "60px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={course.corequisite || course.prerequisite || ""}
      >
        {course.corequisite || course.prerequisite || ""}
      </td>
      {/* HK tự chọn */}
      <td
        style={{
          border: "1px solid #ddd",
          textAlign: "center",
          padding: "2px",
          fontSize: "9px",
          color: "#000",
          maxWidth: "52px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={course.expected_semester?.toString() ?? ""}
      >
        {course.expected_semester ?? ""}
      </td>
      {/* Student cells */}
      {students.map((student) => {
        const result = resultMap.get(student.id)?.get(course.course_code);
        const val = getCellValue(result);
        const style = getCellStyle(result);
        return (
          <td
            key={student.id}
            title={
              result
                ? `${student.full_name} — ${course.course_name}: ${result.status}${
                    result.score_10 ? ` (${result.score_10})` : ""
                  }`
                : "Nhấp đúp để nhập kết quả học tập"
            }
            onDoubleClick={() =>
              onCellDoubleClick(
                student.id,
                student.full_name,
                course.course_code,
                course.course_name,
                result
              )
            }
            style={{
              border: "1px solid #ddd",
              textAlign: "center",
              padding: "2px 1px",
              fontSize: "9px",
              fontWeight: "600",
              cursor: "pointer",
              ...style,
            }}
          >
            {val}
          </td>
        );
      })}
    </tr>
  );
};
