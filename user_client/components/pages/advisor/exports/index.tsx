"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import {
  FileSpreadsheet,
  Loader2,
  AlertCircle
} from "lucide-react";

import FeedbackModal from "./components/FeedbackModal";
import ResultEditModal from "./components/ResultEditModal";
import ExportLogsTable from "./components/ExportLogsTable";
import OnlineMatrixTable, {
  MatrixCourse,
  MatrixResult,
  MatrixPreviewData
} from "./components/OnlineMatrixTable";
import ClassSelectorCard from "./components/ClassSelectorCard";
import MatrixHeader from "./components/MatrixHeader";
import DeleteLogModal from "./components/DeleteLogModal";
import NotificationModal, { NotificationData } from "./components/NotificationModal";

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
  const [notification, setNotification] = useState<NotificationData | null>(null);

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
        <ClassSelectorCard
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          classes={classes}
          currentAdvisorName={currentAdvisor?.full_name}
          onAccessMatrix={() => setViewMatrix(true)}
        />
      )}

      {/* MATRIX PREVIEW DISPLAY */}
      {activeTab === "matrix" && viewMatrix && (
        <div className="space-y-4 relative z-10">
          <MatrixHeader
            setViewMatrix={setViewMatrix}
            classes={classes}
            selectedClassId={selectedClassId}
            matrixData={matrixData}
            stats={stats}
            handleDownloadExcel={handleDownloadExcel}
            downloadingId={downloadingId}
            matrixLoading={matrixLoading}
          />

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
      <DeleteLogModal
        isOpen={!!deletingLogId}
        onClose={() => setDeletingLogId(null)}
        onConfirm={handleDeleteLogConfirm}
      />

      {/* Custom Alert/Notification Modal */}
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
