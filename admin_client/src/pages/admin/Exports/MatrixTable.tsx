import React, { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "../../../services/api";
import { AdvisorFeedbackModal } from "./AdvisorFeedbackModal";

import type { MatrixPreviewData, MatrixTableProps } from "./types";
import { KB_LABELS, KB_COLORS } from "./matrixUtils";
import { MatrixStats } from "./components/MatrixStats";
import { MatrixInfoLegend } from "./components/MatrixInfoLegend";
import { MatrixFeedbackRow } from "./components/MatrixFeedbackRow";
import { MatrixCourseRow } from "./components/MatrixCourseRow";
import { EditResultModal } from "./components/EditResultModal";

// ─── State ───────────────────────────────────────────────────────────────────

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: MatrixPreviewData };

type FetchAction =
  | { type: "FETCH" }
  | { type: "SUCCESS"; data: MatrixPreviewData }
  | { type: "ERROR"; message: string };

function fetchReducer(_prev: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case "FETCH":   return { status: "loading" };
    case "SUCCESS": return { status: "ok", data: action.data };
    case "ERROR":   return { status: "error", message: action.message };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MatrixTable: React.FC<MatrixTableProps> = ({
  classId,
  onClose,
  isInline = false,
}) => {
  const [state, dispatch] = React.useReducer(fetchReducer, { status: "loading" });
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [editingStudent, setEditingStudent] = React.useState<{ id: string; name: string; feedback: string } | null>(null);
  const [savingFeedback, setSavingFeedback] = React.useState(false);

  const [editingResult, setEditingResult] = React.useState<{
    studentId: string;
    studentName: string;
    courseCode: string;
    courseName: string;
    result?: MatrixPreviewData["results"][0];
  } | null>(null);
  const [savingResult, setSavingResult] = React.useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && onClose) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch preview data
  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    dispatch({ type: "FETCH" });
    api
      .get<MatrixPreviewData>(`/exports/matrix/preview`, { params: { class_id: classId } })
      .then((res) => {
        if (!cancelled) dispatch({ type: "SUCCESS", data: res.data });
      })
      .catch((err) => {
        if (!cancelled) {
          const msg =
            (err as { response?: { data?: { message?: string } }; message?: string })
              ?.response?.data?.message ??
            (err as { message?: string })?.message ??
            "Không tải được dữ liệu";
          dispatch({ type: "ERROR", message: msg });
        }
      });
    return () => { cancelled = true; };
  }, [classId, refreshKey]);

  const handleFeedbackClick = (studentId: string, studentName: string, currentFeedback: string | null) => {
    setEditingStudent({
      id: studentId,
      name: studentName,
      feedback: currentFeedback || "",
    });
  };

  const handleCellDoubleClick = (
    studentId: string,
    studentName: string,
    courseCode: string,
    courseName: string,
    result?: MatrixPreviewData["results"][0]
  ) => {
    setEditingResult({
      studentId,
      studentName,
      courseCode,
      courseName,
      result,
    });
  };

  const handleSaveResult = async (data: {
    status: "PASSED" | "FAILED" | "STUDYING";
    score_10: number | null;
    letter_grade: string | null;
    semester_number: number | null;
    school_year: string | null;
    semester_code: string | null;
  }) => {
    if (!editingResult) return;
    setSavingResult(true);
    try {
      if (editingResult.result?.id) {
        await api.patch(`/student_course_results/${editingResult.result.id}`, data);
      } else {
        await api.post(`/student_course_results`, {
          student_id: editingResult.studentId,
          course_code: editingResult.courseCode,
          course_name: editingResult.courseName,
          status: data.status,
          score_10: data.score_10,
          letter_grade: data.letter_grade,
          semester_number: data.semester_number,
          school_year: data.school_year,
          semester_code: data.semester_code,
          is_latest: true,
        });
      }
      setRefreshKey((prev) => prev + 1);
      setEditingResult(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cập nhật điểm học phần thất bại");
    } finally {
      setSavingResult(false);
    }
  };

  const handleDeleteResult = async () => {
    if (!editingResult?.result?.id) return;
    setSavingResult(true);
    try {
      await api.delete(`/student_course_results/${editingResult.result.id}`);
      setRefreshKey((prev) => prev + 1);
      setEditingResult(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xoá kết quả học phần thất bại");
    } finally {
      setSavingResult(false);
    }
  };

  // ── Build result lookup map: student_id → course_code → result ──────────────
  const matrixData = state.status === "ok" ? state.data : null;

  const resultMap = React.useMemo(() => {
    const map = new Map<string, Map<string, MatrixPreviewData["results"][0]>>();
    if (!matrixData) return map;
    for (const r of matrixData.results) {
      if (!map.has(r.student_id)) map.set(r.student_id, new Map());
      map.get(r.student_id)!.set(r.course_code, r);
    }
    return map;
  }, [matrixData]);

  const studentStatusMap = React.useMemo(() => {
    const map = new Map<string, { onTrack: boolean }>();
    if (!matrixData) return map;
    for (const student of matrixData.students) {
      const studentResults = resultMap.get(student.id);
      const failedCourses = new Set<string>();
      const passedCourses = new Set<string>();
      if (studentResults) {
        for (const r of studentResults.values()) {
          if (r.status === "PASSED") {
            passedCourses.add(r.course_code);
            failedCourses.delete(r.course_code);
          } else if (r.status === "FAILED") {
            if (!passedCourses.has(r.course_code)) {
              failedCourses.add(r.course_code);
            }
          }
        }
      }
      const onTrack = failedCourses.size === 0;
      map.set(student.id, { onTrack });
    }
    return map;
  }, [matrixData, resultMap]);

  // ── Group courses by knowledge_block ─────────────────────────────────────────
  const groupedCourses = React.useMemo(() => {
    if (!matrixData) return [];
    const groups = new Map<string, typeof matrixData.courses>();
    for (const c of matrixData.courses) {
      const key = c.knowledge_block ?? "OTHER";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries());
  }, [matrixData]);

  // ── Stat counters ─────────────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    if (!matrixData) return null;
    let passed = 0, studying = 0, failed = 0;
    for (const r of matrixData.results) {
      if (r.status === "PASSED") passed++;
      else if (r.status === "STUDYING") studying++;
      else if (r.status === "FAILED") failed++;
    }
    return { passed, studying, failed, total: matrixData.results.length };
  }, [matrixData]);

  return (
    <div className={isInline ? "flex flex-col bg-white border-2 border-black rounded-xl overflow-hidden shadow-lg mt-4" : "fixed inset-0 z-50 flex flex-col bg-white"}>
      {/* ── Topbar ── */}
      <div className="flex items-center justify-between border-b-2 border-black bg-slate-50 px-6 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-black tracking-tight">
              Ma trận kiểm định học tập
            </h2>
            {matrixData && (
              <p className="text-xs text-black mt-0.5 font-medium">
                {matrixData.programInfo.program_code} · {matrixData.programInfo.program_name}
                {matrixData.programInfo.major_name ? ` — ${matrixData.programInfo.major_name}` : ""}
              </p>
            )}
          </div>
          {stats && <MatrixStats stats={stats} />}
        </div>
        <div className="flex items-center gap-2">
          {!isInline && onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-black hover:bg-slate-100 border border-transparent hover:border-black transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-auto bg-white">
        {state.status === "loading" && (
          <div className="flex h-full items-center justify-center gap-3 text-black">
            <Loader2 className="animate-spin text-black" size={24} />
            <span className="text-sm font-bold">Đang tải ma trận...</span>
          </div>
        )}
        {state.status === "error" && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-xl bg-rose-50 border-2 border-black p-6 text-black text-sm max-w-md text-center">
              <p className="font-black mb-1">Không tải được dữ liệu</p>
              <p className="font-semibold">{state.message}</p>
            </div>
          </div>
        )}
        {matrixData && (
          <table
            style={{
              borderCollapse: "collapse",
              fontSize: "10px",
              fontFamily: "inherit",
              color: "#000",
              tableLayout: "fixed",
              minWidth: `${496 + matrixData.students.length * 72}px`,
            }}
          >
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

            <tbody>
              {groupedCourses.map(([block, courses]) => {
                const bgColor = KB_COLORS[block] ?? "#f5f5f5";
                const blockLabel = KB_LABELS[block] ?? block;
                let courseIndex = 0;
                for (const [b, cs] of groupedCourses) {
                  if (b === block) break;
                  courseIndex += cs.length;
                }

                return (
                  <React.Fragment key={block}>
                    {/* Group header row */}
                    <tr>
                      <td
                        colSpan={9 + matrixData.students.length}
                        style={{
                          backgroundColor: bgColor,
                          border: "1px solid #bbb",
                          padding: "4px 8px",
                          fontWeight: "800",
                          fontSize: "10px",
                          color: "#000",
                          position: "sticky",
                          left: 0,
                          zIndex: 10,
                        }}
                      >
                        {blockLabel}
                      </td>
                    </tr>
                    {/* Course rows */}
                    {courses.map((course, idx) => {
                      const rowIdx = courseIndex + idx + 1;
                      const rowBg = idx % 2 === 0 ? "#ffffff" : "#fafafa";

                      return (
                        <MatrixCourseRow
                          key={course.course_code}
                          course={course}
                          rowIdx={rowIdx}
                          rowBg={rowBg}
                          students={matrixData.students}
                          resultMap={resultMap}
                          onCellDoubleClick={handleCellDoubleClick}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* ── Footer legend ── */}
            <tfoot>
              <tr>
                <td
                  colSpan={9 + matrixData.students.length}
                  style={{
                    padding: "6px 10px",
                    fontSize: "8px",
                    color: "#000",
                    fontWeight: "bold",
                    fontStyle: "italic",
                    borderTop: "2px solid #bbb",
                    backgroundColor: "#f5f5f5",
                    position: "sticky",
                    left: 0,
                    zIndex: 10,
                  }}
                >
                  <b>Ghi chú:</b> x = Đã qua | o = Trượt | số = Học kỳ đang học (STUDYING) | trống = Chưa có dữ liệu
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── Custom Advisor Feedback Modal ── */}
      <AdvisorFeedbackModal
        key={editingStudent?.id || "none"}
        isOpen={editingStudent !== null}
        studentName={editingStudent?.name ?? ""}
        initialFeedback={editingStudent?.feedback ?? ""}
        onClose={() => setEditingStudent(null)}
        onSave={async (newFeedback) => {
          if (!editingStudent) return;
          setSavingFeedback(true);
          try {
            await api.patch(`/students/${editingStudent.id}`, {
              advisor_feedback: newFeedback.trim() || null,
            });
            setRefreshKey((prev) => prev + 1);
            setEditingStudent(null);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Cập nhật feedback thất bại");
          } finally {
            setSavingFeedback(false);
          }
        }}
        saving={savingFeedback}
      />

      <EditResultModal
        key={editingResult ? `${editingResult.studentId}-${editingResult.courseCode}` : "none"}
        isOpen={editingResult !== null}
        studentName={editingResult?.studentName ?? ""}
        courseName={editingResult?.courseName ?? ""}
        courseCode={editingResult?.courseCode ?? ""}
        initialResult={editingResult?.result}
        onClose={() => setEditingResult(null)}
        onSave={handleSaveResult}
        onDelete={handleDeleteResult}
        saving={savingResult}
      />
    </div>
  );
};
