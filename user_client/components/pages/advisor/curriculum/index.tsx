"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  UploadCloud,
  Layers,
  Terminal,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building2,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Trash2,
  FileSpreadsheet,
  XCircle,
  FileText
} from "lucide-react";

interface Program {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
}

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface ConflictItem {
  courseCode: string;
  diffFields: string[];
  dbRecord: {
    course_name: string;
    credits: number;
    theory_hours: number | null;
    practice_hours: number | null;
    knowledge_block: string;
  };
  excelRecord: {
    courseCode: string;
    courseName: string;
    credits: number | null;
    theoryHours: number | null;
    practiceHours: number | null;
    knowledgeBlock: string;
  };
}

interface CustomCourseEdit {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  knowledgeBlock: string;
}

interface LogItem {
  type: "info" | "progress" | "warning" | "error" | "success";
  text: string;
  timestamp: string;
}

export default function AdvisorCurriculumPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Flow steps: "select_program" | "upload" | "streaming" | "conflict_resolution" | "preview"
  const [phase, setPhase] = useState<"select_program" | "upload" | "streaming" | "conflict_resolution" | "preview">("select_program");

  // Selection state
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // SSE Streaming state
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 100 });
  const [streamStatus, setStreamStatus] = useState<"connecting" | "processing" | "completed" | "error">("connecting");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Conflict state
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, "db" | "excel" | "custom">>({});
  const [customEdits, setCustomEdits] = useState<Record<string, CustomCourseEdit>>({});
  const [editingConflictCode, setEditingConflictCode] = useState<string | null>(null);
  const [conflictEditForm, setConflictEditForm] = useState<CustomCourseEdit | null>(null);

  // Preview state
  const [previewCourses, setPreviewCourses] = useState<CoursePreviewItem[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [selectedPreviewCodes, setSelectedPreviewCodes] = useState<Set<string>>(new Set());
  const [submittingImport, setSubmittingImport] = useState(false);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const res = await api.get("/programs?limit=250");
        setPrograms(res.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  // Scroll terminal
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (type: LogItem["type"], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, text, timestamp }]);
  };

  const handleStartUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !textContent.trim()) {
      alert("Vui lòng tải lên tệp tin Excel hoặc dán dữ liệu văn bản!");
      return;
    }

    setPhase("streaming");
    setLogs([]);
    setStreamStatus("connecting");
    setProgress({ current: 0, total: 100 });

    const formData = new FormData();
    formData.append("programId", selectedProgramId);
    formData.append("sheetIndex", sheetIndex.toString());
    if (file) {
      formData.append("file", file);
    } else {
      formData.append("textContent", textContent);
    }

    try {
      const startRes = await api.post("/curriculum_imports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const session = startRes.data?.importSession;
      if (!session) {
        throw new Error("Không khởi tạo được phiên nhập liệu từ Server");
      }

      setActiveSessionId(session.id);
      startSseConnection(session.id);
    } catch (err: any) {
      setStreamStatus("error");
      addLog("error", `Lỗi tải lên: ${err.message || "Không kết nối được server"}`);
    }
  };

  const startSseConnection = (sessionId: string) => {
    const apiBase = api.defaults.baseURL || "http://localhost:3000";
    const token = sessionStorage.getItem("user_token") || "";
    const sseUrl = `${apiBase}/curriculum_imports/${sessionId}/progress?token=${encodeURIComponent(token)}`;

    addLog("info", "Khởi động kết nối dòng dữ liệu phân tích (SSE)...");

    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStreamStatus("processing");
      addLog("info", "Kết nối máy chủ bóc tách thành công.");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const {
          type,
          message,
          current,
          total,
          preview,
          warnings,
          conflicts: serverConflicts,
          sheets
        } = payload;

        if (type === "info") {
          addLog("info", message);
        } else if (type === "progress") {
          setProgress({ current: current || 0, total: total || 100 });
          if (payload.conflict) {
            addLog("warning", message);
          } else {
            addLog("progress", message);
          }
        } else if (type === "unresolved_headers") {
          setStreamStatus("error");
          addLog("error", "Không thể bóc tách do tiêu đề cột không khớp. Vui lòng kiểm tra lại file Excel.");
          eventSource.close();
        } else if (type === "completed") {
          setStreamStatus("completed");
          setProgress({ current: total || 100, total: total || 100 });
          addLog("success", message || "Bóc tách dữ liệu hoàn tất.");
          eventSource.close();

          setTimeout(() => {
            setPreviewCourses(preview || []);
            setPreviewWarnings(warnings || []);
            setSheetsList(sheets || []);
            setConflicts(serverConflicts || []);

            // Set default resolutions
            const initialRes: Record<string, "db" | "excel"> = {};
            (serverConflicts || []).forEach((c: ConflictItem) => {
              initialRes[c.courseCode] = "excel";
            });
            setResolutions(initialRes);

            if (serverConflicts && serverConflicts.length > 0) {
              setPhase("conflict_resolution");
            } else {
              setPhase("preview");
              setSelectedPreviewCodes(new Set((preview || []).map((c: any) => c.courseCode)));
            }
          }, 1000);
        } else if (type === "error") {
          setStreamStatus("error");
          addLog("error", message || "Lỗi đường ống dẫn.");
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE message:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setStreamStatus("error");
      addLog("error", "Lỗi kết nối máy chủ dòng dữ liệu.");
      eventSource.close();
    };
  };

  const handleCancelImport = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (activeSessionId) {
      try {
        await api.delete(`/curriculum_imports/${activeSessionId}`);
      } catch (err) {
        console.error("Failed to cancel import session:", err);
      }
    }
    setPhase("select_program");
    setFile(null);
    setTextContent("");
    setActiveSessionId(null);
  };

  // Conflict resolution handlers
  const handleStartCustomEdit = (conflict: ConflictItem) => {
    setEditingConflictCode(conflict.courseCode);
    setConflictEditForm({
      courseCode: customEdits[conflict.courseCode]?.courseCode || conflict.excelRecord.courseCode,
      courseName: customEdits[conflict.courseCode]?.courseName || conflict.excelRecord.courseName,
      credits: customEdits[conflict.courseCode]?.credits ?? conflict.excelRecord.credits,
      theoryHours: customEdits[conflict.courseCode]?.theoryHours ?? conflict.excelRecord.theoryHours,
      practiceHours: customEdits[conflict.courseCode]?.practiceHours ?? conflict.excelRecord.practiceHours,
      knowledgeBlock: customEdits[conflict.courseCode]?.knowledgeBlock || conflict.excelRecord.knowledgeBlock
    });
  };

  const handleSaveCustomEdit = () => {
    if (editingConflictCode && conflictEditForm) {
      setCustomEdits((prev) => ({ ...prev, [editingConflictCode]: conflictEditForm }));
      setResolutions((prev) => ({ ...prev, [editingConflictCode]: "custom" }));
      setEditingConflictCode(null);
      setConflictEditForm(null);
    }
  };

  const handleConfirmConflicts = () => {
    const updatedCourses: CoursePreviewItem[] = [];

    for (const course of previewCourses) {
      const code = course.courseCode;
      const resolution = resolutions[code];
      const conflict = conflicts.find((c) => c.courseCode === code);

      if (!resolution || !conflict) {
        updatedCourses.push(course);
        continue;
      }

      if (resolution === "db") {
        // Giữ cũ
        updatedCourses.push({
          ...course,
          courseName: conflict.dbRecord.course_name,
          credits: conflict.dbRecord.credits,
          theoryHours: conflict.dbRecord.theory_hours,
          practiceHours: conflict.dbRecord.practice_hours,
          knowledgeBlock: conflict.dbRecord.knowledge_block
        });
      } else if (resolution === "custom" && customEdits[code]) {
        const edit = customEdits[code];
        const newCourseCode = edit.courseCode || code;

        if (newCourseCode !== code) {
          // Versioning song song: Giữ bản cũ + thêm bản mới đổi mã
          updatedCourses.push(course); // Giữ môn cũ nguyên vẹn
          updatedCourses.push({
            ...course,
            courseCode: newCourseCode,
            courseName: edit.courseName ?? course.courseName,
            credits: edit.credits ?? course.credits,
            theoryHours: edit.theoryHours ?? course.theoryHours,
            practiceHours: edit.practiceHours ?? course.practiceHours,
            knowledgeBlock: edit.knowledgeBlock ?? course.knowledgeBlock
          });
        } else {
          // Tùy biến thông thường
          updatedCourses.push({
            ...course,
            ...edit,
            courseCode: newCourseCode
          });
        }
      } else {
        // Ghi đè excel
        updatedCourses.push(course);
      }
    }

    setPreviewCourses(updatedCourses);
    setSelectedPreviewCodes(new Set(updatedCourses.map((c) => c.courseCode)));
    setPhase("preview");
  };

  // Preview page handlers
  const handleConfirmFinalImport = async () => {
    if (!activeSessionId) return;
    setSubmittingImport(true);
    try {
      const selectedCourses = previewCourses.filter((c) => selectedPreviewCodes.has(c.courseCode));
      await api.post(`/curriculum_imports/${activeSessionId}/confirm`, {
        courses: selectedCourses
      });
      alert("Tải lên và chuẩn hóa khung chương trình thành công!");
      setPhase("select_program");
      setFile(null);
      setTextContent("");
      setActiveSessionId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi lưu khung chương trình học");
    } finally {
      setSubmittingImport(false);
    }
  };

  const handleToggleSelectAllPreview = () => {
    if (selectedPreviewCodes.size === previewCourses.length) {
      setSelectedPreviewCodes(new Set());
    } else {
      setSelectedPreviewCodes(new Set(previewCourses.map((c) => c.courseCode)));
    }
  };

  const handleToggleSelectPreview = (code: string) => {
    const next = new Set(selectedPreviewCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedPreviewCodes(next);
  };

  // Helper values
  const uniqueMajors = Array.from(new Set(programs.map((p) => p.major_name).filter(Boolean))).sort();
  const filteredPrograms = programs.filter((p) => p.major_name === selectedMajor);
  const selectedProgramDetails = programs.find((p) => p.id === selectedProgramId);

  if (loadingPrograms) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải dữ liệu chương trình...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/75 border border-emerald-250 text-emerald-800 text-xs font-bold mb-2">
          <UploadCloud size={12} />
          <span>Bóc tách học thuật</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Nhập khung chương trình
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Hệ thống tự động phân tích cấu trúc, chuẩn hóa khối kiến thức và đối soát xung đột của khung chương trình.
        </p>
      </div>

      {/* ── PHASE 1: SELECT PROGRAM ─────────────────────────────── */}
      {phase === "select_program" && (
        <div className="max-w-md mx-auto py-10">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Layers size={22} />
              </div>
              <h2 className="text-lg font-bold text-neutral-900">Liên kết Chương trình học</h2>
              <p className="text-xs text-neutral-400">
                Chọn Ngành học và phiên bản Khung chương trình đào tạo để bắt đầu.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider">
                  Ngành học (Major)
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                    setSelectedProgramId("");
                  }}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Chọn ngành học --</option>
                  {uniqueMajors.map((m) => (
                    <option key={m} value={m || ""}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider">
                  Chương trình đào tạo (Program)
                </label>
                <select
                  disabled={!selectedMajor}
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- Chọn khung chương trình --</option>
                  {filteredPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.program_name} ({p.program_code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={!selectedProgramId}
                onClick={() => setPhase("upload")}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Tiếp tục
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: UPLOAD FILE ────────────────────────────────── */}
      {phase === "upload" && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Selected Program Alert */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-650 text-white rounded-lg">
                <Layers size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">
                  {selectedProgramDetails?.program_name}
                </p>
                <p className="text-[10px] font-mono text-emerald-600 uppercase">
                  Mã CTĐT: {selectedProgramDetails?.program_code}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPhase("select_program")}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              Thay đổi
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleStartUpload} className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
            <h3 className="text-md font-bold text-neutral-900">Phương pháp nhập dữ liệu</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Upload File */}
              <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-neutral-50/30">
                <div className="space-y-2">
                  <div className="p-2.5 bg-emerald-50 rounded-xl w-fit text-emerald-600">
                    <FileSpreadsheet size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">Tải lên tệp Excel</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Hỗ trợ tệp bảng tính `.xls`, `.xlsx`. Vui lòng tải đúng file cấu trúc chuẩn.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                      setTextContent("");
                    }
                  }}
                  className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Option B: Text Area */}
              <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-neutral-50/30">
                <div className="space-y-2">
                  <div className="p-2.5 bg-zinc-100 rounded-xl w-fit text-neutral-500">
                    <FileText size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-800">Dán dữ liệu thô</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Sao chép dòng dữ liệu từ file văn bản hoặc trang đào tạo và dán trực tiếp.
                  </p>
                </div>
                <textarea
                  placeholder="Mã môn | Tên môn | Tín chỉ..."
                  value={textContent}
                  onChange={(e) => {
                    setTextContent(e.target.value);
                    setFile(null);
                  }}
                  rows={2}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Trang tính trong Excel (Sheet Index)
              </label>
              <input
                type="number"
                min={0}
                value={sheetIndex}
                onChange={(e) => setSheetIndex(Number(e.target.value))}
                className="border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-mono w-28 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
              <button
                type="button"
                onClick={() => setPhase("select_program")}
                className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                Bắt đầu phân tích
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── PHASE 3: REALTIME SSE STREAMING ─────────────────────── */}
      {phase === "streaming" && (
        <div className="max-w-2xl mx-auto bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-emerald-500 border border-neutral-800">
                {streamStatus === "processing" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                ) : streamStatus === "completed" ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Terminal className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase">
                  {streamStatus === "connecting" && "Đang thiết lập kết nối..."}
                  {streamStatus === "processing" && "Đang phân tích dòng dữ liệu..."}
                  {streamStatus === "completed" && "Hoàn tất bóc tách!"}
                  {streamStatus === "error" && "Gặp sự cố xử lý"}
                </h3>
                <p className="text-[10px] text-neutral-400 font-semibold uppercase mt-0.5">
                  Đường ống dẫn dữ liệu PathMinded
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-500">
              {progress.current}/{progress.total} học phần
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
              <span>Độ hoàn thành</span>
              <span className="text-emerald-600">
                {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden border border-zinc-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300 shadow-md shadow-emerald-500/20"
                style={{
                  width: `${progress.total > 0 ? Math.min(100, (progress.current / progress.total) * 100) : 0}%`
                }}
              />
            </div>
          </div>

          {/* Terminal Console Logs */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase block tracking-wider">
              Nhật ký xử lý chi tiết (Terminal Console)
            </label>
            <div className="rounded-xl border border-zinc-200 bg-neutral-950 p-4 font-mono text-xs overflow-y-auto max-h-60 min-h-45 shadow-inner flex flex-col gap-1.5 select-text text-neutral-350">
              {logs.map((log, idx) => {
                let colorClass = "text-neutral-400";
                if (log.type === "info") colorClass = "text-emerald-400 font-semibold";
                else if (log.type === "warning") colorClass = "text-amber-400 font-semibold";
                else if (log.type === "error") colorClass = "text-red-400 font-bold";
                else if (log.type === "success") colorClass = "text-emerald-400 font-bold";
                else if (log.type === "progress") colorClass = "text-neutral-200";

                return (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <span className="text-neutral-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={colorClass}>{log.text}</span>
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={handleCancelImport}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ phiên
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 4: CONFLICT RESOLUTION (VERSIONING) ───────────── */}
      {phase === "conflict_resolution" && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Banner warning */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-sm font-bold text-rose-800 block">
                Phát hiện {conflicts.length} Xung đột Dữ liệu Học phần!
              </span>
              <p className="text-xs text-rose-650 mt-1 leading-relaxed">
                Các môn học bên dưới đã có sẵn trong CSDL chương trình học, nhưng các thuộc tính (tên, tín chỉ, giờ lý thuyết...) bị thay đổi trong tệp Excel. Vui lòng đối soát.
              </p>
              <p className="text-[10px] text-amber-600 mt-1.5 font-semibold">
                💡 Gợi ý gộp phiên bản (Versioning): Đổi Mã học phần sang dạng `MÃ_V2` trong Tùy biến để lưu song song cả hai phiên bản.
              </p>
            </div>
          </div>

          {/* List of conflicts */}
          <div className="space-y-6">
            {conflicts.map((conflict) => {
              const choice = resolutions[conflict.courseCode] || "excel";
              const isCustom = choice === "custom";
              const currentCustom = customEdits[conflict.courseCode];

              return (
                <div
                  key={conflict.courseCode}
                  className="rounded-2xl border bg-white p-5 space-y-4 shadow-sm transition-all duration-300"
                  style={{
                    borderColor:
                      choice === "db"
                        ? "#10b981"
                        : choice === "excel"
                          ? "#10b981"
                          : "#8b5cf6"
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
                        {isCustom && currentCustom?.courseCode && currentCustom.courseCode !== conflict.courseCode ? (
                          <>
                            {conflict.courseCode} <span className="text-violet-600">→ {currentCustom.courseCode}</span>
                          </>
                        ) : (
                          conflict.courseCode
                        )}
                      </span>
                      <span className="text-xs font-bold text-neutral-800">Đối soát thuộc tính</span>
                    </div>

                    {/* Radio Options */}
                    <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-xl border border-zinc-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "db" }))}
                        className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                          choice === "db"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        Giữ cũ (DB)
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "excel" }))}
                        className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                          choice === "excel"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        Ghi đè (Excel)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartCustomEdit(conflict)}
                        className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                          isCustom
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-neutral-500 hover:text-neutral-900"
                        }`}
                      >
                        <Edit2 size={11} />
                        {isCustom ? "Đã sửa đổi" : "Tùy biến"}
                      </button>
                    </div>
                  </div>

                  {/* Editing custom panel */}
                  {editingConflictCode === conflict.courseCode && conflictEditForm && (
                    <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/30 space-y-3">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                        <Edit2 size={12} className="text-violet-600" />
                        Chỉnh sửa / Đổi phiên bản (Versioning)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-neutral-500 flex items-center gap-1 flex-wrap">
                            Mã học phần:
                            <span className="text-violet-600 text-[10px]">(Ví dụ: {conflict.courseCode}_V2)</span>
                          </label>
                          <input
                            type="text"
                            value={conflictEditForm.courseCode}
                            onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseCode: e.target.value.toUpperCase().trim() })}
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800 font-mono uppercase"
                          />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-neutral-500">Tên học phần:</label>
                          <input
                            type="text"
                            value={conflictEditForm.courseName}
                            onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseName: e.target.value })}
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-neutral-500">Số tín chỉ:</label>
                          <input
                            type="number"
                            value={conflictEditForm.credits ?? ""}
                            onChange={(e) => setConflictEditForm({ ...conflictEditForm, credits: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-neutral-500">Khối kiến thức:</label>
                          <select
                            value={conflictEditForm.knowledgeBlock}
                            onChange={(e) => setConflictEditForm({ ...conflictEditForm, knowledgeBlock: e.target.value })}
                            className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-850 cursor-pointer"
                          >
                            <option value="GENERAL">Đại cương</option>
                            <option value="SECTOR_CORE">Cơ sở khối ngành</option>
                            <option value="MAJOR_CORE">Cơ sở ngành</option>
                            <option value="SPECIALIZED">Chuyên ngành</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => { setEditingConflictCode(null); setConflictEditForm(null); }}
                          className="rounded-lg px-3 py-1 bg-zinc-250 text-neutral-600 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomEdit}
                          className="rounded-lg px-3 py-1 bg-violet-600 hover:bg-violet-55 text-white text-xs font-bold cursor-pointer"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comparisons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DB Version */}
                    <div className="p-3 border border-zinc-150 rounded-xl bg-neutral-50/50 space-y-1.5 text-xs">
                      <p className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">Trong CSDL</p>
                      <div>
                        <span className="text-neutral-450">Tên môn:</span>{" "}
                        <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-rose-600" : "text-neutral-800"}`}>
                          {conflict.dbRecord.course_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-455">Số tín chỉ:</span>{" "}
                        <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-rose-600" : "text-neutral-850"}`}>
                          {conflict.dbRecord.credits} tín chỉ
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-455">Khối kiến thức:</span>{" "}
                        <span className="font-medium text-neutral-750">
                          {conflict.dbRecord.knowledge_block}
                        </span>
                      </div>
                    </div>

                    {/* Excel Version */}
                    <div className="p-3 border border-zinc-150 rounded-xl bg-neutral-50/50 space-y-1.5 text-xs">
                      <p className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">
                        {isCustom ? "Phiên bản Tùy biến" : "Đề xuất Excel"}
                      </p>
                      <div>
                        <span className="text-neutral-455">Tên môn:</span>{" "}
                        <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-emerald-700" : "text-neutral-800"}`}>
                          {isCustom ? currentCustom?.courseName : conflict.excelRecord.courseName}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-455">Số tín chỉ:</span>{" "}
                        <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-emerald-700" : "text-neutral-850"}`}>
                          {isCustom ? currentCustom?.credits : conflict.excelRecord.credits} tín chỉ
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-455">Khối kiến thức:</span>{" "}
                        <span className="font-medium text-neutral-750">
                          {isCustom ? currentCustom?.knowledgeBlock : conflict.excelRecord.knowledgeBlock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={handleCancelImport}
              className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
            >
              Hủy phiên
            </button>
            <button
              type="button"
              onClick={handleConfirmConflicts}
              className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/10"
            >
              Xác nhận &amp; Tiếp tục
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 5: PREVIEW & CONFIRM ──────────────────────────── */}
      {phase === "preview" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-850">
                Bóc tách thành công khung chương trình!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Vui lòng xem lại danh sách môn học dưới đây và chọn những môn cần lưu vào CSDL.
              </p>
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              Đã chọn <strong className="text-emerald-700 font-bold">{selectedPreviewCodes.size}/{previewCourses.length}</strong> môn học
            </div>
          </div>

          {/* Warnings Panel */}
          {previewWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Chú ý: Phát hiện {previewWarnings.length} cảnh báo phân tích cú pháp
              </span>
              <div className="divide-y divide-amber-100 max-h-36 overflow-y-auto pr-1">
                {previewWarnings.map((w, idx) => (
                  <p key={idx} className="text-[10px] text-amber-700 py-1 font-medium leading-relaxed">
                    Dòng {w.rowNumber || "?"}: {w.message} {w.rawValue ? `(Giá trị: "${w.rawValue}")` : ""}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPreviewCodes.size === previewCourses.length}
                        onChange={handleToggleSelectAllPreview}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5">Mã môn</th>
                    <th className="px-5 py-3.5">Tên học phần</th>
                    <th className="px-5 py-3.5">Tín chỉ</th>
                    <th className="px-5 py-3.5">Khối kiến thức</th>
                    <th className="px-5 py-3.5">Loại môn</th>
                    <th className="px-5 py-3.5">Học kỳ</th>
                    <th className="px-5 py-3.5">Môn tiên quyết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {previewCourses.map((c, index) => {
                    const isSelected = selectedPreviewCodes.has(c.courseCode);
                    return (
                      <tr
                        key={`${c.courseCode}-${index}`}
                        className={`hover:bg-neutral-50/50 transition-colors text-neutral-700 ${
                          isSelected ? "" : "opacity-55 bg-neutral-50/20"
                        }`}
                      >
                        <td className="px-5 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectPreview(c.courseCode)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                          {c.courseCode}
                        </td>
                        <td className="px-5 py-4 font-semibold text-neutral-900">
                          {c.courseName}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-neutral-800">
                          {c.credits ?? 0}
                        </td>
                        <td className="px-5 py-4 text-neutral-600">
                          {c.knowledgeBlock === "GENERAL" ? "Đại cương" :
                           c.knowledgeBlock === "SECTOR_CORE" ? "Cơ sở khối ngành" :
                           c.knowledgeBlock === "MAJOR_CORE" ? "Cơ sở ngành" : "Chuyên ngành"}
                        </td>
                        <td className="px-5 py-4 text-[10px] font-bold text-neutral-500 uppercase">
                          {c.courseType}
                        </td>
                        <td className="px-5 py-4 font-mono font-medium">
                          HK {c.expectedSemester || "—"}
                        </td>
                        <td className="px-5 py-4 font-mono text-neutral-500 truncate max-w-40" title={c.prerequisite || ""}>
                          {c.prerequisite || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={handleCancelImport}
              className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <XCircle size={14} />
              Hủy bỏ &amp; Xóa phiên
            </button>
            <button
              type="button"
              disabled={submittingImport || selectedPreviewCodes.size === 0}
              onClick={handleConfirmFinalImport}
              className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
            >
              {submittingImport ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang lưu vào DB...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  Xác nhận Nhập vào DB ({selectedPreviewCodes.size} môn)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
