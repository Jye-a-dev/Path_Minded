"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import {
  FileSpreadsheet,
  Download,
  Building2,
  Loader2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  TableProperties,
  AlertCircle,
  Trash2
} from "lucide-react";

import FeedbackModal from "./components/FeedbackModal";
import ResultEditModal from "./components/ResultEditModal";
import ExportLogsTable from "./components/ExportLogsTable";
import OnlineMatrixTable, {
  MatrixCourse,
  MatrixResult,
  MatrixPreviewData
} from "./components/OnlineMatrixTable";

export interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

export interface ExportLog {
  id: string;
  class_id?: string;
  advisor_id?: string;
  exported_at: string;
  file_name?: string;
}

interface Advisor {
  id: string;
  full_name: string;
}

export default function AdvisorExportsPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null);
  const [selectedClassId, setSelectedClassId] = useReloadPersistentState("advisor_exports_selectedClassId", "");
  const [viewMatrix, setViewMatrix] = useReloadPersistentState("advisor_exports_viewMatrix", false);
  const [activeTab, setActiveTab] = useReloadPersistentState<"matrix" | "history">("advisor_exports_activeTab", "matrix");

  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data
  const [matrixData, setMatrixData] = useState<MatrixPreviewData | null>(null);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);

  // Modals editing state
  const [editingStudent, setEditingStudent] = useState<{ id: string; name: string; feedback: string } | null>(null);
  const [savingFeedback, setSavingFeedback] = useState(false);

  const [editingResult, setEditingResult] = useState<{
    studentId: string;
    studentName: string;
    courseCode: string;
    courseName: string;
    result?: MatrixResult;
  } | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const advRes = await api.get(`/advisors?user_id=${user.id}`);
      let advisorId = "";
      let advisorRec: Advisor | null = null;
      if (advRes.data && advRes.data.length > 0) {
        advisorRec = advRes.data[0];
        setCurrentAdvisor(advisorRec);
        advisorId = advisorRec?.id || "";
      }

      if (advisorRec) {
        const classesRes = await api.get(`/classes?advisor_id=${advisorId}&limit=500`);
        const classData: ClassItem[] = classesRes.data || [];
        setClasses(classData);

        if (classData.length > 0) {
          setSelectedClassId((prev) => prev || classData[0].id);
        }

        const logsRes = await api.get(`/exports?advisor_id=${advisorId}&limit=100`);
        setExportLogs(logsRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load export page metadata:", err);
    } finally {
      setLoading(false);
    }
  }, [user, setSelectedClassId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData, refreshKey]);

  // Load matrix preview when class selection changes and view is open
  useEffect(() => {
    if (!selectedClassId || !viewMatrix) {
      if (matrixData !== null) {
        Promise.resolve().then(() => setMatrixData(null));
      }
      return;
    }

    const loadMatrix = async () => {
      setMatrixLoading(true);
      try {
        const res = await api.get<MatrixPreviewData>(`/exports/matrix/preview`, {
          params: { class_id: selectedClassId }
        });
        setMatrixData(res.data);
      } catch (err) {
        console.error("Failed to load matrix preview:", err);
        setMatrixData(null);
      } finally {
        setMatrixLoading(false);
      }
    };
    void loadMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, viewMatrix, refreshKey]);

  const handleDownloadExcel = async (classId: string, classCode: string) => {
    if (!currentAdvisor) return;
    setDownloadingId(classId);
    try {
      const response = await api.post(
        "/exports/matrix",
        { classId, advisorId: currentAdvisor.id },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `Matrix_${classCode}_${Date.now()}.xlsx`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      const logsRes = await api.get(`/exports?advisor_id=${currentAdvisor.id}&limit=100`);
      setExportLogs(logsRes.data || []);
    } catch (err) {
      console.error("Failed to download matrix file:", err);
      setNotification({
        type: "error",
        title: "Lỗi xuất dữ liệu",
        message: "Xuất ma trận học tập thất bại. Vui lòng thử lại sau."
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteLogConfirm = async () => {
    if (!deletingLogId) return;
    try {
      await api.delete(`/exports/${deletingLogId}`);
      setRefreshKey((prev) => prev + 1);
      setDeletingLogId(null);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Bản ghi lịch sử xuất dữ liệu đã được xóa vĩnh viễn khỏi hệ thống."
      });
    } catch (err) {
      console.error("Failed to delete export log:", err);
      setDeletingLogId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa bản ghi",
        message: "Xóa bản ghi thất bại. Vui lòng thử lại sau."
      });
    }
  };

  const handleSaveFeedback = async (feedbackText: string) => {
    if (!editingStudent) return;
    setSavingFeedback(true);
    try {
      await api.patch(`/students/${editingStudent.id}`, {
        advisor_feedback: feedbackText.trim() || null,
      });
      setRefreshKey((prev) => prev + 1);
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        title: "Cập nhật thất bại",
        message: "Cập nhật feedback thất bại"
      });
    } finally {
      setSavingFeedback(false);
    }
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
      setNotification({
        type: "success",
        title: "Cập nhật thành công",
        message: "Cập nhật điểm số học phần thành công."
      });
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        title: "Cập nhật thất bại",
        message: "Cập nhật điểm học phần thất bại."
      });
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
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Đã xoá kết quả học phần thành công."
      });
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        title: "Xóa thất bại",
        message: "Xoá kết quả học phần thất bại."
      });
    } finally {
      setSavingResult(false);
    }
  };

  // Memo calculations for matrix processing
  const resultMap = useMemo(() => {
    const map = new Map<string, Map<string, MatrixResult>>();
    if (!matrixData) return map;
    for (const r of matrixData.results) {
      if (!map.has(r.student_id)) map.set(r.student_id, new Map());
      map.get(r.student_id)!.set(r.course_code, r);
    }
    return map;
  }, [matrixData]);

  const studentStatusMap = useMemo(() => {
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

  const groupedCourses = useMemo(() => {
    if (!matrixData) return [];
    const groups = new Map<string, MatrixCourse[]>();
    for (const c of matrixData.courses) {
      const key = c.knowledge_block ?? "OTHER";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }
    return Array.from(groups.entries());
  }, [matrixData]);

  const stats = useMemo(() => {
    if (!matrixData) return null;
    let passed = 0, studying = 0, failed = 0;
    for (const r of matrixData.results) {
      if (r.status === "PASSED") passed++;
      else if (r.status === "STUDYING") studying++;
      else if (r.status === "FAILED") failed++;
    }
    return { passed, studying, failed, total: matrixData.results.length };
  }, [matrixData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-650" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải cổng xuất báo cáo...
          </p>
        </div>
      </div>
    );
  }

  if (!currentAdvisor) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Không tìm thấy hồ sơ Cố vấn</h1>
        <p className="text-sm text-neutral-500">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ Cố vấn học tập nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <FileSpreadsheet size={12} />
            <span>Kết xuất báo cáo lớp tôi phụ trách</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Báo cáo Ma trận Lớp
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Theo dõi tiến độ, kiểm soát và kết xuất ma trận học tập trực tuyến cho sinh viên thuộc các lớp do bạn cố vấn.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 relative z-10">
        <button
          onClick={() => {
            setActiveTab("matrix");
            setViewMatrix(false);
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "matrix"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Xem ma trận trực tuyến
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Lịch sử kết xuất tệp
        </button>
      </div>

      {/* ONLINE MATRIX TAB */}
      {activeTab === "matrix" && !viewMatrix && (
        <div className="flex items-center justify-center py-12 px-4 min-h-[50vh] relative z-10">
          <div className="max-w-md w-full space-y-6 p-8 rounded-2xl border border-zinc-200 bg-white shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-200 hover:shadow-2xl">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <TableProperties className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-neutral-900 tracking-tight">Ma trận kiểm định học tập</h2>
              <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
                Vui lòng chọn lớp học do bạn cố vấn để bắt đầu đối soát, cập nhật điểm số và kết xuất ma trận học tập trực tuyến.
              </p>
            </div>

            <div className="mt-6 space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  Lớp học phụ trách (Class)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-55 px-4 py-3 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer hover:border-zinc-300"
                >
                  {classes.length === 0 ? (
                    <option value="">Không có lớp phụ trách</option>
                  ) : (
                    classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.class_code} {cls.class_name ? `(${cls.class_name})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedClassId && (
                <div className="space-y-1.5 bg-neutral-50 p-4 rounded-xl border border-zinc-200">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Cố vấn học tập (CVHT)
                  </span>
                  <span className="text-sm font-extrabold text-neutral-800 block">
                    {currentAdvisor?.full_name || "Chưa xác định"}
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedClassId}
                onClick={() => setViewMatrix(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer"
              >
                Truy cập Ma trận học tập
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATRIX PREVIEW DISPLAY */}
      {activeTab === "matrix" && viewMatrix && (
        <div className="space-y-4 relative z-10">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMatrix(false)}
                className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 text-neutral-700 transition cursor-pointer"
                title="Quay lại"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="text-base font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
                  <Building2 size={16} className="text-emerald-600" />
                  Lớp: {classes.find((c) => c.id === selectedClassId)?.class_code || "N/A"}
                </h2>
                {matrixData && (
                  <p className="text-xs text-neutral-400 font-bold mt-0.5 font-mono">
                    Chương trình: {matrixData.programInfo.program_code} · {matrixData.programInfo.program_name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {stats && (
                <div className="flex items-center gap-2 bg-neutral-50 border border-zinc-200 rounded-xl p-1.5 text-[10px] font-bold">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                    Đạt: {stats.passed}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                    Học: {stats.studying}
                  </span>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg">
                    Rớt: {stats.failed}
                  </span>
                </div>
              )}

              {selectedClassId && (
                <button
                  onClick={() => {
                    const cls = classes.find((c) => c.id === selectedClassId);
                    if (cls) handleDownloadExcel(selectedClassId, cls.class_code);
                  }}
                  disabled={downloadingId === selectedClassId || matrixLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {downloadingId === selectedClassId ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang kết xuất...
                    </>
                  ) : (
                    <>
                      <Download size={12} />
                      Tải Excel
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-125">
            {matrixLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-500 py-32 text-xs font-bold">
                <Loader2 className="animate-spin text-emerald-650" size={24} />
                <span>Đang kết dựng ma trận học tập trực tuyến...</span>
              </div>
            ) : matrixData ? (
              <OnlineMatrixTable
                matrixData={matrixData}
                studentStatusMap={studentStatusMap}
                resultMap={resultMap}
                groupedCourses={groupedCourses}
                onFeedbackClick={(student) => setEditingStudent({ id: student.id, name: student.full_name, feedback: student.advisor_feedback || "" })}
                onCellDoubleClick={(student, course, result) => setEditingResult({
                  studentId: student.id,
                  studentName: student.full_name,
                  courseCode: course.course_code,
                  courseName: course.course_name,
                  result
                })}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-neutral-400 py-32 font-bold">
                Không thể tải dữ liệu ma trận lớp học.
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPORT LOG HISTORY TAB */}
      {activeTab === "history" && (
        <ExportLogsTable
          exportLogs={exportLogs}
          classes={classes}
          downloadingId={downloadingId}
          handleDownloadExcel={handleDownloadExcel}
          setSelectedClassId={setSelectedClassId}
          setViewMatrix={setViewMatrix}
          setActiveTab={setActiveTab}
          setDeletingLogId={setDeletingLogId}
        />
      )}

      {/* ADVISOR FEEDBACK EDIT MODAL */}
      <FeedbackModal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSave={handleSaveFeedback}
        studentName={editingStudent?.name || ""}
        initialFeedback={editingStudent?.feedback || ""}
        saving={savingFeedback}
      />

      {/* EDIT COURSE RESULT MODAL */}
      {editingResult && (
        <ResultEditModal
          editingResult={editingResult}
          onClose={() => setEditingResult(null)}
          savingResult={savingResult}
          handleSaveResult={handleSaveResult}
          handleDeleteResult={handleDeleteResult}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase">
                Xóa lịch sử xuất dữ liệu
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi xuất dữ liệu này? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingLogId(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteLogConfirm}
                className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-lg shadow-rose-600/10"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert/Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-emerald-600">
                {notification.title}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                {notification.message}
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white bg-emerald-600 hover:bg-emerald-55 shadow-lg shadow-emerald-600/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
