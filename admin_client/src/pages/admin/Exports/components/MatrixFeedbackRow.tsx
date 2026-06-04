import React from "react";
import type { MatrixPreviewData } from "../types";

interface MatrixFeedbackRowProps {
  students: MatrixPreviewData["students"];
  onFeedbackClick: (studentId: string, studentName: string, currentFeedback: string | null) => void;
}

export const MatrixFeedbackRow: React.FC<MatrixFeedbackRowProps> = ({
  students,
  onFeedbackClick,
}) => {
  return (
    <tr>
      <td
        colSpan={9}
        style={{
          backgroundColor: "#e8eaf6",
          border: "1px solid #bbb",
          padding: "6px 12px",
          fontWeight: "850",
          fontSize: "9.5px",
          color: "#000",
          textAlign: "left",
          verticalAlign: "middle",
          position: "sticky",
          left: 0,
          zIndex: 20,
        }}
      >
        Ý kiến feedback của GVHT{" "}
        <span
          style={{
            fontSize: "8px",
            fontWeight: "bold",
            color: "#000",
            marginLeft: "6px",
            fontStyle: "italic",
          }}
        >
          (Bấm vào ô để sửa)
        </span>
      </td>
      {students.map((s) => (
        <td
          key={s.id}
          onClick={() => onFeedbackClick(s.id, s.full_name, s.advisor_feedback)}
          style={{
            backgroundColor: "#f5f5f5",
            border: "1px solid #bbb",
            textAlign: "center",
            fontSize: "8.5px",
            color: "#000",
            fontWeight: "700",
            padding: "6px 4px",
            width: "72px",
            minWidth: "72px",
            maxWidth: "72px",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            cursor: "pointer",
          }}
          className="hover:bg-indigo-50/75 transition-colors"
          title={s.advisor_feedback ? `Feedback cho ${s.full_name}: ${s.advisor_feedback}` : `Bấm để nhập/sửa ý kiến feedback cho ${s.full_name}`}
        >
          {s.advisor_feedback || "—"}
        </td>
      ))}
    </tr>
  );
};
