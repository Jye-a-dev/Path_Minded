"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  FileSpreadsheet,
  Download,
  Building2,
  Loader2,
  CheckCircle,
  X,
  ArrowLeft,
  ArrowRight,
  TableProperties,
  Trash2,
  History,
  AlertCircle
} from "lucide-react";

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

interface Advisor {
  id: string;
  full_name: string;
}

interface ExportLog {
  id: string;
  class_id?: string;
  advisor_id?: string;
  exported_at: string;
  file_name?: string;
}

interface MatrixCourse {
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

interface MatrixStudent {
  id: string;
  student_code: string;
  full_name: string;
  advisor_feedback: string | null;
}

interface MatrixResult {
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

interface MatrixPreviewData {
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

// Cell value logic
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

// Knowledge block grouping helpers
const KB_LABELS: Record<string, string> = {
  GENERAL: "Kiến thức giáo dục đại cương",
  SECTOR_CORE: "Kiến thức cơ sở khối ngành",
  MAJOR_CORE: "Kiến thức cơ sở ngành",
  SPECIALIZED: "Kiến thức chuyên ngành",
};

const KB_COLORS: Record<string, string> = {
  GENERAL:     "#d4edda",
  SECTOR_CORE: "#cce5ff",
  MAJOR_CORE:  "#fff3cd",
  SPECIALIZED: "#f8d7da",
};

export default function AdvisorExportsPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [viewMatrix, setViewMatrix] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "history">("matrix");

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
      // 1. Fetch advisor
      const advRes = await api.get(`/advisors?user_id=${user.id}`);
      let advisorId = "";
      let advisorRec: Advisor | null = null;
      if (advRes.data && advRes.data.length > 0) {
        advisorRec = advRes.data[0];
        setCurrentAdvisor(advisorRec);
        advisorId = advisorRec?.id || "";
      }

      if (advisorRec) {
        // 2. Fetch classes managed by this advisor
        const classesRes = await api.get(`/classes?advisor_id=${advisorId}&limit=500`);
        const classData: ClassItem[] = classesRes.data || [];
        setClasses(classData);

        if (classData.length > 0) {
          setSelectedClassId(classData[0].id);
        }

        // 3. Fetch export logs
        const logsRes = await api.get(`/exports?advisor_id=${advisorId}&limit=100`);
        setExportLogs(logsRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load export page metadata:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshKey]);

  // Load matrix preview when class selection changes and view is open
  useEffect(() => {
    if (!selectedClassId || !viewMatrix) {
      setMatrixData(null);
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

      // Refresh export logs
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

  const handleSaveFeedback = async (studentId: string, feedbackText: string) => {
    setSavingFeedback(true);
    try {
      await api.patch(`/students/${studentId}`, {
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
              <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
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
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer hover:border-zinc-300"
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

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {matrixLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-500 py-32 text-xs font-bold">
                <Loader2 className="animate-spin text-emerald-650" size={24} />
                <span>Đang kết dựng ma trận học tập trực tuyến...</span>
              </div>
            ) : matrixData ? (
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
                          <div className="grid grid-cols-2 gap-x-4 text-neutral-500 font-semibold leading-relaxed">
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
                          onClick={() => setEditingStudent({ id: s.id, name: s.full_name, feedback: s.advisor_feedback || "" })}
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

                    <tr style={{ backgroundColor: "#e2e8f0" }}>
                      {[
                        { label: "TT", w: 28 },
                        { label: "Mã học phần", w: 68 },
                        { label: "Tên học phần / (Số tín chỉ)", w: 160 },
                        { label: "LT", w: 28 },
                        { label: "TH", w: 28 },
                        { label: "TT", w: 28 },
                        { label: "BB/TC", w: 44 },
                        { label: "ĐK học trước", w: 60 },
                        { label: "HK dự kiến", w: 52 },
                      ].map((col, idx) => {
                        const isSticky = idx < 3;
                        const stickyLeft = idx === 0 ? 0 : idx === 1 ? 28 : idx === 2 ? 96 : undefined;
                        return (
                          <th
                            key={idx}
                            style={{
                              backgroundColor: "#f1f5f9",
                              border: "1px solid #cbd5e1",
                              textAlign: "center",
                              fontWeight: "800",
                              fontSize: "9px",
                              color: "#334155",
                              padding: "6px 2px",
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
                            backgroundColor: "#f1f5f9",
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
                                    padding: "4px 4px",
                                    fontSize: "9px",
                                    fontWeight: "750",
                                    position: "sticky",
                                    left: 28,
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
                                      onDoubleClick={() =>
                                        setEditingResult({
                                          studentId: student.id,
                                          studentName: student.full_name,
                                          courseCode: course.course_code,
                                          courseName: course.course_name,
                                          result,
                                        })
                                      }
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
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative z-10">
          <div className="p-5 border-b border-zinc-150 flex items-center justify-between">
            <h3 className="text-md font-bold text-neutral-900 flex items-center gap-1.5">
              <History size={18} className="text-emerald-650" />
              Lịch sử các tệp ma trận đã kết xuất
            </h3>
            <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded uppercase">
              Tổng số: {exportLogs.length} bản ghi
            </span>
          </div>

          {exportLogs.length === 0 ? (
            <div className="p-16 text-center text-xs text-neutral-450 italic font-semibold">
              Chưa có lịch sử kết xuất nào cho tài khoản cố vấn này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-450 font-bold text-[9px] uppercase tracking-wider border-b border-zinc-150">
                    <th className="px-5 py-3">Chi tiết tệp</th>
                    <th className="px-5 py-3">Mã lớp</th>
                    <th className="px-5 py-3">Thời gian tạo</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {exportLogs.map((log) => {
                    const classObj = classes.find((c) => c.id === log.class_id);
                    const classCode = classObj ? classObj.class_code : "N/A";
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50/50 text-neutral-700 font-medium">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-neutral-900 block truncate max-w-xs md:max-w-md">
                            {log.file_name || `Matrix_${classCode}.xlsx`}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono">ID: {log.id}</span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-neutral-800">
                          {classCode}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-neutral-500">
                          {new Date(log.exported_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            {log.class_id && (
                              <button
                                onClick={() => {
                                  setSelectedClassId(log.class_id!);
                                  setViewMatrix(true);
                                  setActiveTab("matrix");
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 text-xs font-bold text-neutral-700 transition cursor-pointer"
                                title="Xem ma trận trực tuyến"
                              >
                                <TableProperties size={12} />
                                Xem ma trận
                              </button>
                            )}
                            {log.class_id && (
                              <button
                                onClick={() => handleDownloadExcel(log.class_id!, classCode)}
                                disabled={downloadingId === log.class_id}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-50 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                                title="Tải lại file Excel"
                              >
                                {downloadingId === log.class_id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Download size={12} />
                                )}
                                Tải Excel
                              </button>
                            )}
                            <button
                              onClick={() => setDeletingLogId(log.id)}
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa bản ghi lịch sử"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ADVISOR FEEDBACK EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative text-neutral-900 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
                Ý kiến Feedback của GVHT
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handleSaveFeedback(editingStudent.id, editingStudent.feedback);
              }}
              className="space-y-4"
            >
              <div className="text-xs text-neutral-600 font-bold">
                Sinh viên: <span className="font-extrabold underline text-neutral-900">{editingStudent.name}</span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                  Ý kiến phản hồi / Nhận xét của cố vấn
                </label>
                <textarea
                  value={editingStudent.feedback}
                  onChange={(e) => setEditingStudent({ ...editingStudent, feedback: e.target.value })}
                  placeholder="Ví dụ: Đủ điều kiện tốt nghiệp, nợ môn học đại cương..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all resize-none font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  disabled={savingFeedback}
                  className="rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 px-4 py-2 text-xs font-bold text-neutral-700 transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer"
                >
                  {savingFeedback && <Loader2 size={12} className="animate-spin text-white" />}
                  Lưu nhận xét
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COURSE RESULT MODAL */}
      {editingResult && (
        <EditResultInlineModal
          editingResult={editingResult}
          setEditingResult={setEditingResult}
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
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
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
              {notification.type === "success" ? (
                <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="text-rose-600 h-5 w-5 shrink-0" />
              )}
              <h3 className={`text-sm font-extrabold uppercase tracking-wide ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
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
                className={`rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white ${notification.type === "success" ? "bg-emerald-600 hover:bg-emerald-55 shadow-lg shadow-emerald-600/10" : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/10"}`}
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

// Inline edit modal component
interface EditResultInlineModalProps {
  editingResult: {
    studentId: string;
    studentName: string;
    courseCode: string;
    courseName: string;
    result?: MatrixResult;
  };
  setEditingResult: (val: any) => void;
  savingResult: boolean;
  handleSaveResult: (data: any) => Promise<void>;
  handleDeleteResult: () => Promise<void>;
}

function EditResultInlineModal({
  editingResult,
  setEditingResult,
  savingResult,
  handleSaveResult,
  handleDeleteResult,
}: EditResultInlineModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(
    (editingResult.result?.status as "PASSED" | "FAILED" | "STUDYING") ?? "PASSED"
  );
  const [score10, setScore10] = useState<string>(
    editingResult.result?.score_10 !== undefined && editingResult.result?.score_10 !== null
      ? editingResult.result.score_10.toString()
      : ""
  );
  const [letterGrade, setLetterGrade] = useState<string>(editingResult.result?.letter_grade ?? "");
  const [semesterNumber, setSemesterNumber] = useState<string>(
    editingResult.result?.semester_number !== undefined && editingResult.result?.semester_number !== null
      ? editingResult.result.semester_number.toString()
      : ""
  );
  const [schoolYear, setSchoolYear] = useState<string>(editingResult.result?.school_year ?? "");
  const [semesterCode, setSemesterCode] = useState<string>(editingResult.result?.semester_code ?? "");

  // Auto score map logic
  const handleScoreChange = (val: string) => {
    setScore10(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      if (num >= 4.0) {
        setStatus("PASSED");
      } else {
        setStatus("FAILED");
      }

      if (num >= 9.0) setLetterGrade("A+");
      else if (num >= 8.5) setLetterGrade("A");
      else if (num >= 8.0) setLetterGrade("B+");
      else if (num >= 7.0) setLetterGrade("B");
      else if (num >= 6.5) setLetterGrade("C+");
      else if (num >= 5.5) setLetterGrade("C");
      else if (num >= 5.0) setLetterGrade("D+");
      else if (num >= 4.0) setLetterGrade("D");
      else setLetterGrade("F");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedScore = score10.trim() !== "" ? parseFloat(score10) : null;
    const parsedSemester = semesterNumber.trim() !== "" ? parseInt(semesterNumber, 10) : null;

    if (status !== "STUDYING" && parsedScore !== null && (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10)) {
      alert("Điểm số phải nằm trong khoảng từ 0 đến 10");
      return;
    }

    if (parsedSemester !== null && (isNaN(parsedSemester) || parsedSemester < 1)) {
      alert("Học kỳ phải là số nguyên lớn hơn hoặc bằng 1");
      return;
    }

    await handleSaveResult({
      status,
      score_10: status === "STUDYING" ? null : parsedScore,
      letter_grade: status === "STUDYING" ? null : letterGrade.trim() || null,
      semester_number: parsedSemester,
      school_year: schoolYear.trim() || null,
      semester_code: semesterCode.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative text-neutral-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4 shrink-0">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            Cập nhật kết quả học phần
          </h3>
          <button
            type="button"
            onClick={() => setEditingResult(null)}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-xs text-neutral-600 space-y-1 mb-4 font-bold shrink-0">
          <div>
            Sinh viên: <span className="font-extrabold text-emerald-700 underline">{editingResult.studentName}</span>
          </div>
          <div>
            Học phần: <span className="font-extrabold text-neutral-900">{editingResult.courseCode} — {editingResult.courseName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Trạng thái học tập
            </label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as "PASSED" | "FAILED" | "STUDYING";
                setStatus(newStatus);
                if (newStatus === "STUDYING") {
                  setScore10("");
                  setLetterGrade("");
                }
              }}
              className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="PASSED">Đạt (PASSED)</option>
              <option value="FAILED">Rớt (FAILED)</option>
              <option value="STUDYING">Đang học (STUDYING)</option>
            </select>
          </div>

          {status !== "STUDYING" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                  Điểm số (Thang 10)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={score10}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  placeholder="Ví dụ: 8.5"
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                  Điểm chữ
                </label>
                <input
                  type="text"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                  placeholder="Ví dụ: A"
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all uppercase"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Học kỳ thực tế
            </label>
            <input
              type="number"
              min="1"
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              placeholder="Ví dụ: 3"
              className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                Năm học (Niên chế)
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="Ví dụ: 2024-2025"
                className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                Mã học kỳ (Niên chế)
              </label>
              <input
                type="text"
                value={semesterCode}
                onChange={(e) => setSemesterCode(e.target.value)}
                placeholder="Ví dụ: HK1"
                className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-150 shrink-0 font-bold">
            {editingResult.result?.id ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={savingResult}
                className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs text-rose-600 transition cursor-pointer disabled:opacity-50"
              >
                Xóa kết quả
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                disabled={savingResult}
                className="rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 px-4 py-2 text-xs text-neutral-700 transition cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingResult}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 disabled:opacity-50 px-4 py-2 text-xs text-white shadow-lg transition cursor-pointer"
              >
                {savingResult && <Loader2 size={12} className="animate-spin text-white" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 rounded-2xl z-20">
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xl space-y-4 max-w-sm">
              <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide">Xóa kết quả học phần</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xoá kết quả môn này của sinh viên {editingResult.studentName}? Môn học này sẽ được thiết lập về trạng thái trống trên ma trận.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-zinc-200 hover:bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeleteResult();
                    setShowDeleteConfirm(false);
                  }}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  Xóa kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
