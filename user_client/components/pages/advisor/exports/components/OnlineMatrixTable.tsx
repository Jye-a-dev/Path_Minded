import React from "react";
import { Building2 } from "lucide-react";

export interface MatrixCourse {
  course_code: string;
  course_name: string;
  credits: number | null;
  theory_hours: number | null;
  practice_hours: number | null;
  project_hours: number | null;
  internship_hours: number | null;
  expected_semester: number | null;
  course_type: string;
  is_required: boolean;
  prerequisite: string | null;
  corequisite: string | null;
  organizing_semester: string | null;
  knowledge_block: string | null;
  course_group: string | null;
}

export interface MatrixStudent {
  id: string;
  student_code: string;
  full_name: string;
  advisor_feedback: string | null;
}

export interface MatrixResult {
  id?: string;
  student_id: string;
  course_code: string;
  status: string;
  semester_number: number | null;
  score_10: number | null;
  letter_grade: string | null;
  school_year?: string | null;
  semester_code?: string | null;
}

export interface MatrixPreviewData {
  classInfo: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    program_id: string;
  };
  programInfo: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    total_credits: number | null;
  };
  students: MatrixStudent[];
  courses: MatrixCourse[];
  results: MatrixResult[];
}

interface OnlineMatrixTableProps {
  matrixData: MatrixPreviewData;
  studentStatusMap: Map<string, { onTrack: boolean }>;
  resultMap: Map<string, Map<string, MatrixResult>>;
  groupedCourses: [string, MatrixCourse[]][];
  onCellDoubleClick: (
    student: MatrixStudent,
    course: MatrixCourse,
    result: MatrixResult | undefined
  ) => void;
  onFeedbackClick: (student: MatrixStudent) => void;
}

const KB_LABELS: Record<string, string> = {
  GENERAL: "Kiến thức giáo dục đại cương",
  SECTOR_CORE: "Kiến thức cơ sở khối ngành",
  MAJOR_CORE: "Kiến thức cơ sở ngành",
  SPECIALIZED: "Kiến thức chuyên ngành",
};

const KB_COLORS: Record<string, string> = {
  GENERAL: "#d4edda",
  SECTOR_CORE: "#cce5ff",
  MAJOR_CORE: "#fff3cd",
  SPECIALIZED: "#f8d7da",
};

function getCellValue(result: MatrixResult | undefined): string {
  if (!result) return "";
  if (result.status === "PASSED") return result.score_10?.toString() ?? "x";
  if (result.status === "FAILED") return result.score_10?.toString() ?? "o";
  if (result.status === "STUDYING") {
    if (result.semester_code) {
      return result.semester_code;
    }
    return result.semester_number?.toString() ?? "y";
  }
  return "";
}

function getCellStyle(result: MatrixResult | undefined): React.CSSProperties {
  if (!result) return {};
  if (result.status === "PASSED") return { backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: "bold" };
  if (result.status === "FAILED") return { backgroundColor: "#ffebee", color: "#c62828", fontWeight: "bold" };
  if (result.status === "STUDYING") return { backgroundColor: "#fffde7", color: "#ef6c00", fontWeight: "bold" };
  return {};
}

export default function OnlineMatrixTable({
  matrixData,
  studentStatusMap,
  resultMap,
  groupedCourses,
  onCellDoubleClick,
  onFeedbackClick
}: OnlineMatrixTableProps) {
  return (
    <div className="overflow-auto max-w-full">
      <table
        style={{
          borderCollapse: "collapse",
          fontSize: "10px",
          fontFamily: "inherit",
          color: "#000",
          tableLayout: "fixed",
          minWidth: `${496 + matrixData.students.length * 72}px`,
        }}
        className="w-full text-left"
      >
        <thead>
          <tr>
            <td
              colSpan={9}
              rowSpan={2}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                padding: "10px 12px",
                verticalAlign: "middle",
                minWidth: "480px",
                position: "sticky",
                left: 0,
                zIndex: 20,
              }}
            >
              <div className="flex flex-col gap-1 text-[9px]">
                <div className="font-extrabold text-neutral-800 text-xs tracking-tight mb-1 uppercase">
                  Chương trình đào tạo
                </div>
                <div className="grid grid-cols-2 gap-x-4 text-neutral-505 font-semibold leading-relaxed">
                  <div>• Mã: <span className="font-bold text-neutral-700 font-mono">{matrixData.programInfo.program_code}</span></div>
                  <div>• Ngành: <span className="font-bold text-neutral-700">{matrixData.programInfo.major_name || "Chung"}</span></div>
                  <div className="col-span-2">• Tên: <span className="font-bold text-neutral-700">{matrixData.programInfo.program_name}</span></div>
                  <div>• Khóa học: <span className="font-bold text-neutral-700 font-mono">{matrixData.classInfo.cohort_year || "N/A"}</span></div>
                  <div>• Định mức: <span className="font-bold text-neutral-700 font-mono">{matrixData.programInfo.total_credits || 120} TC</span></div>
                </div>
              </div>
            </td>
            {matrixData.students.map((s) => {
              const studentStatus = studentStatusMap.get(s.id);
              const headerBg = studentStatus?.onTrack ? "#e8f5e9" : "#ffebee";
              const headerBorder = studentStatus?.onTrack ? "#a5d6a7" : "#ffcdd2";
              return (
                <td
                  key={s.id}
                  style={{
                    backgroundColor: headerBg,
                    border: `1px solid ${headerBorder}`,
                    textAlign: "center",
                    fontSize: "8.5px",
                    color: "#000",
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

          <tr>
            {matrixData.students.map((s) => {
              const studentStatus = studentStatusMap.get(s.id);
              const headerBg = studentStatus?.onTrack ? "#f1f8e9" : "#fffafb";
              const headerBorder = studentStatus?.onTrack ? "#c5e1a5" : "#ffcdd2";
              return (
                <td
                  key={s.id}
                  style={{
                    backgroundColor: headerBg,
                    border: `1px solid ${headerBorder}`,
                    textAlign: "center",
                    fontSize: "9px",
                    color: "#000",
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

          <tr>
            <td
              colSpan={9}
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #ddd",
                padding: "6px 12px",
                fontWeight: "850",
                fontSize: "9.5px",
                color: "#166534",
                textAlign: "left",
                verticalAlign: "middle",
                position: "sticky",
                left: 0,
                zIndex: 20,
              }}
            >
              Ý kiến feedback của GVHT{" "}
              <span className="text-[8px] font-bold text-neutral-450 ml-1.5 italic">
                (Click vào ô để nhập/sửa)
              </span>
            </td>
            {matrixData.students.map((s) => (
              <td
                key={s.id}
                onClick={() => onFeedbackClick(s)}
                style={{
                  backgroundColor: "#f9fafb",
                  border: "1px solid #ddd",
                  textAlign: "center",
                  fontSize: "8.5px",
                  color: "#374151",
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
                className="hover:bg-emerald-50/50 transition-colors"
                title={s.advisor_feedback ? `Feedback: ${s.advisor_feedback}` : "Bấm để nhập nhận xét"}
              >
                {s.advisor_feedback || "—"}
              </td>
            ))}
          </tr>

          <tr style={{ backgroundColor: "#f8fafc", textTransform: "uppercase" }}>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "32px", minWidth: "32px", position: "sticky", left: 0, zIndex: 20, backgroundColor: "#f8fafc" }}>STT</th>
            <th style={{ border: "1px solid #cbd5e1", padding: "6px 6px", fontSize: "8.5px", color: "#334155", width: "64px", minWidth: "64px", position: "sticky", left: 32, zIndex: 20, backgroundColor: "#f8fafc" }}>Mã môn</th>
            <th style={{ border: "1px solid #cbd5e1", padding: "6px 6px", fontSize: "8.5px", color: "#334155", width: "200px", minWidth: "200px", position: "sticky", left: 96, zIndex: 20, backgroundColor: "#f8fafc" }}>Tên học phần</th>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "30px", minWidth: "30px" }}>LT</th>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "30px", minWidth: "30px" }}>TH</th>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "30px", minWidth: "30px" }}>DA</th>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "30px", minWidth: "30px" }}>BB</th>
            <th style={{ border: "1px solid #cbd5e1", padding: "6px 3px", fontSize: "8.5px", color: "#334155", width: "60px", minWidth: "60px" }}>Môn Prereq</th>
            <th style={{ border: "1px solid #cbd5e1", textAlign: "center", padding: "6px 2px", fontSize: "8.5px", color: "#334155", width: "32px", minWidth: "32px" }}>HK</th>
            {matrixData.students.map((s, i) => (
              <th
                key={s.id}
                style={{
                  border: "1px solid #cbd5e1",
                  textAlign: "center",
                  fontWeight: "850",
                  fontSize: "9px",
                  color: "#334155",
                  padding: "6px 2px",
                  width: "72px",
                  minWidth: "72px",
                }}
              >
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {groupedCourses.map(([block, courses]) => {
            const bgColor = KB_COLORS[block] ?? "#f3f4f6";
            const blockLabel = KB_LABELS[block] ?? block;

            let courseIndex = 0;
            for (const [b, cs] of groupedCourses) {
              if (b === block) break;
              courseIndex += cs.length;
            }

            return (
              <React.Fragment key={block}>
                <tr>
                  <td
                    colSpan={9 + matrixData.students.length}
                    style={{
                      backgroundColor: bgColor,
                      border: "1px solid #cbd5e1",
                      padding: "6px 12px",
                      fontWeight: "800",
                      fontSize: "10px",
                      color: "#1e293b",
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                    }}
                  >
                    {blockLabel}
                  </td>
                </tr>

                {courses.map((course, idx) => {
                  const rowIdx = courseIndex + idx + 1;
                  const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                  const isRequired = course.is_required || course.course_type === "REQUIRED";

                  return (
                    <tr key={course.course_code} style={{ backgroundColor: rowBg, color: "#000" }}>
                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          padding: "4px 2px",
                          fontSize: "9px",
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                          backgroundColor: rowBg,
                        }}
                      >
                        {rowIdx}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "4px 6px",
                          fontSize: "9px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                          position: "sticky",
                          left: 32,
                          zIndex: 10,
                          backgroundColor: rowBg,
                        }}
                      >
                        {course.course_code}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "4px 6px",
                          fontSize: "9px",
                          fontWeight: "500",
                          position: "sticky",
                          left: 96,
                          zIndex: 10,
                          backgroundColor: rowBg,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={course.course_name}
                      >
                        {course.course_name}
                      </td>

                      <td style={{ border: "1px solid #e2e8f0", textAlign: "center", padding: "4px 2px", fontSize: "9px" }}>
                        {course.theory_hours ?? course.credits ?? ""}
                      </td>

                      <td style={{ border: "1px solid #e2e8f0", textAlign: "center", padding: "4px 2px", fontSize: "9px" }}>
                        {course.practice_hours ?? ""}
                      </td>

                      <td style={{ border: "1px solid #e2e8f0", textAlign: "center", padding: "4px 2px", fontSize: "9px" }}>
                        {course.internship_hours ?? ""}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          textAlign: "center",
                          padding: "4px 2px",
                          fontSize: "9px",
                          backgroundColor: isRequired ? "#fef2f2" : "#f0fdf4",
                          color: isRequired ? "#991b1b" : "#166534",
                          fontWeight: "800",
                        }}
                      >
                        {isRequired ? "BB" : "TC"}
                      </td>

                      <td
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "4px 3px",
                          fontSize: "8px",
                          color: "#64748b",
                          maxWidth: "60px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={course.corequisite || course.prerequisite || ""}
                      >
                        {course.corequisite || course.prerequisite || ""}
                      </td>

                      <td style={{ border: "1px solid #e2e8f0", textAlign: "center", padding: "4px 2px", fontSize: "9px" }}>
                        {course.expected_semester ?? ""}
                      </td>

                      {matrixData.students.map((student) => {
                        const result = resultMap.get(student.id)?.get(course.course_code);
                        const val = getCellValue(result);
                        const cellStyle = getCellStyle(result);
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
                            onDoubleClick={() => onCellDoubleClick(student, course, result)}
                            style={{
                              border: "1px solid #e2e8f0",
                              textAlign: "center",
                              padding: "4px 1px",
                              fontSize: "9px",
                              fontWeight: "600",
                              cursor: "pointer",
                              ...cellStyle,
                            }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td
              colSpan={9 + matrixData.students.length}
              className="py-3 px-4 text-[9px] text-neutral-500 font-bold italic border-t border-zinc-200 bg-neutral-50 sticky left-0 z-10"
            >
              <b>Ghi chú:</b> x = Đã qua | o = Trượt | số = Học kỳ đang học (STUDYING) | trống = Chưa có dữ liệu (Nhấp đúp vào ô để cập nhật điểm)
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
