"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import { useAuth } from "@/hooks/useAuth";
import { UploadCloud, Loader2 } from "lucide-react";

import ProgramSelector, { Program } from "./components/ProgramSelector";
import UploadPhase from "./components/UploadPhase";
import StreamingPhase, { LogItem } from "./components/StreamingPhase";
import ConflictResolutionPhase, { ConflictItem, CoursePreviewItem } from "./components/ConflictResolutionPhase";
import PreviewPhase, { WarningItem } from "./components/PreviewPhase";
import CurriculumCoursesView from "./components/CurriculumCoursesView";
import ImportProposalsHistory from "./components/ImportProposalsHistory";
import NotificationModal, { NotificationItem } from "./components/NotificationModal";

export default function AdvisorCurriculumPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [currentAdvisor, setCurrentAdvisor] = useState<{ id: string; full_name: string; department?: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<"curriculum" | "history">("curriculum");
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  // Helper values
  const uniqueMajors = Array.from(new Set(programs.map((p) => p.major_name).filter((m): m is string => !!m))).sort();

  // Flow steps: "select_program" | "view_courses" | "upload" | "streaming" | "conflict_resolution" | "preview"
  const [phase, setPhase] = useReloadPersistentState<"select_program" | "view_courses" | "upload" | "streaming" | "conflict_resolution" | "preview">("advisor_curriculum_phase", "select_program");

  // Selection state
  const [selectedMajor, setSelectedMajor] = useReloadPersistentState("advisor_curriculum_selectedMajor", "");
  const [selectedProgramId, setSelectedProgramId] = useReloadPersistentState("advisor_curriculum_selectedProgramId", "");

  // Safe fallback if refreshed during active import phases
  useEffect(() => {
    if (phase === "streaming" || phase === "conflict_resolution" || phase === "preview") {
      setPhase(selectedProgramId ? "upload" : "select_program");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upload/Session state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // SSE Streaming state
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 100 });
  const [streamStatus, setStreamStatus] = useState<"connecting" | "processing" | "completed" | "error">("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Conflict state
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  // Preview state
  const [previewCourses, setPreviewCourses] = useState<CoursePreviewItem[]>([]);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [submittingImport, setSubmittingImport] = useState(false);

  // Sheets tracking state
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  // Fetch programs and advisor details
  useEffect(() => {
    const fetchInitData = async () => {
      setLoadingPrograms(true);
      try {
        const res = await api.get("/programs?limit=250");
        setPrograms(res.data || []);

        if (user) {
          const advRes = await api.get(`/advisors?user_id=${user.id}`);
          if (advRes.data && advRes.data.length > 0) {
            const advRec = advRes.data[0];
            setCurrentAdvisor(advRec);
          }
        }
      } catch (err) {
        console.error("Failed to load programs and advisor details:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchInitData();
  }, [user]);

  // Sync selectedMajor with advisor's department (case/accent insensitive match)
  useEffect(() => {
    if (!currentAdvisor?.department || uniqueMajors.length === 0) return;

    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/\s+/g, " ")
        .trim();
    };

    const targetDept = currentAdvisor.department;
    const matched = uniqueMajors.find(
      (m) => normalizeString(m) === normalizeString(targetDept)
    );

    if (matched) {
      if (selectedMajor !== matched && (user?.role === "ADVISOR" || !selectedMajor)) {
        setSelectedMajor(matched);
      }
    } else {
      if (selectedMajor !== targetDept && (user?.role === "ADVISOR" || !selectedMajor)) {
        setSelectedMajor(targetDept);
      }
    }
  }, [currentAdvisor, uniqueMajors, user, selectedMajor, setSelectedMajor]);

  const addLog = (type: LogItem["type"], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, text, timestamp }]);
  };

  const handleStartUpload = async (file: File | null, textContent: string, sheetIndex: number) => {
    setPhase("streaming");
    setLogs([]);
    setStreamStatus("connecting");
    setProgress({ current: 0, total: 100 });
    setSheetsList([]);
    setActiveSheetIndex(sheetIndex);

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
    } catch (err: unknown) {
      setStreamStatus("error");
      const message = err instanceof Error ? err.message : "Không kết nối được server";
      addLog("error", `Lỗi tải lên: ${message}`);
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
          conflicts: serverConflicts
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
            setConflicts(serverConflicts || []);
            setSheetsList(payload.sheets || []);
            setActiveSheetIndex(payload.activeSheetIndex || 0);

            if (serverConflicts && serverConflicts.length > 0) {
              setPhase("conflict_resolution");
            } else {
              setPhase("preview");
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
    setPhase("view_courses");
    setActiveSessionId(null);
    setSheetsList([]);
    setActiveSheetIndex(0);
  };

  const handleSheetChange = async (idx: number) => {
    if (!activeSessionId) return;
    setPhase("streaming");
    setLogs([]);
    setStreamStatus("connecting");
    setProgress({ current: 0, total: 100 });
    try {
      await api.post(`/curriculum_imports/${activeSessionId}/reparse`, {
        sheetIndex: idx,
      });
      startSseConnection(activeSessionId);
    } catch (err) {
      console.error("Failed to reparse sheet:", err);
      setNotification({
        type: "error",
        title: "Lỗi chuyển trang",
        message: "Không thể chuyển đổi trang tính: " + (err instanceof Error ? err.message : String(err))
      });
      setPhase("preview");
    }
  };

  const handleConfirmConflicts = (updatedCourses: CoursePreviewItem[]) => {
    setPreviewCourses(updatedCourses);
    setPhase("preview");
  };

  const handleConfirmFinalImport = async (selectedCourses: CoursePreviewItem[]) => {
    if (!activeSessionId) return;
    setSubmittingImport(true);
    try {
      const res = await api.post(`/curriculum_imports/${activeSessionId}/confirm`, {
        courses: selectedCourses
      });
      setNotification({
        type: "success",
        title: "Thành công",
        message: res.data?.message || "Tải lên và đề xuất nhập khung chương trình học thành công!"
      });
      setPhase("view_courses");
      setActiveSessionId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi lưu khung",
        message: error.response?.data?.message || "Lỗi lưu khung chương trình học"
      });
    } finally {
      setSubmittingImport(false);
    }
  };

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
    <div className="space-y-6 relative pb-10">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Page Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/75 border border-emerald-250 text-emerald-800 text-xs font-bold mb-2">
          <UploadCloud size={12} />
          <span>Bóc tách học thuật</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Nhập chương trình
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Hệ thống tự động phân tích cấu trúc, chuẩn hóa khối kiến thức và đối soát xung đột của khung chương trình.
        </p>
      </div>

      {/* Tab Selector */}
      {(phase === "select_program" || phase === "view_courses") && (
        <div className="flex font-bold text-xs select-none mb-4 bg-zinc-50/20 p-1 rounded-2xl w-fit border border-zinc-200">
          <button
            type="button"
            onClick={() => setActiveTab("curriculum")}
            className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "curriculum"
                ? "bg-white text-emerald-800 shadow-sm border border-zinc-150"
                : "text-neutral-450 hover:text-neutral-700"
            }`}
          >
            Khung chương trình
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-emerald-800 shadow-sm border border-zinc-150"
                : "text-neutral-450 hover:text-neutral-700"
            }`}
          >
            Lịch sử đề xuất nhập
          </button>
        </div>
      )}

      {/* Stepper progress indicator */}
      {phase !== "select_program" && phase !== "view_courses" && (
        <div className="relative z-10 max-w-3xl mx-auto py-2">
          <div className="flex items-center justify-between">
            {[
              { id: "select_program", label: "Liên kết CTĐT" },
              { id: "upload", label: "Tải lên" },
              { id: "streaming", label: "Phân tích" },
              { id: "conflict_resolution", label: "Xung đột" },
              { id: "preview", label: "Xem trước & Lưu" },
            ].map((s, idx) => {
              const phaseOrder = ["select_program", "upload", "streaming", "conflict_resolution", "preview"];
              const currentIdx = phaseOrder.indexOf(phase);
              const stepIdx = phaseOrder.indexOf(s.id);
              const isCompleted = stepIdx < currentIdx;
              const isActive = stepIdx === currentIdx;

              // Hide conflict step if we bypass it
              if (s.id === "conflict_resolution" && phase === "preview" && conflicts.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={s.id}>
                  {idx > 0 && (
                    <div className={`flex-1 h-[2.5px] mx-2 transition-all duration-500 rounded-full ${
                      isCompleted ? "bg-emerald-600 shadow-xs shadow-emerald-500/20" : "bg-zinc-200"
                    }`} />
                  )}
                  <div className="flex flex-col items-center gap-2 relative">
                    <div className={`h-9 w-9 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all duration-500 transform ${
                      isCompleted
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-105"
                        : isActive
                        ? "bg-white border-emerald-600 text-emerald-800 shadow-lg shadow-emerald-600/10 scale-110 font-extrabold border-3"
                        : "bg-white border-zinc-200 text-zinc-400"
                    }`}>
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-500 ${
                      isActive ? "text-emerald-700 font-black" : isCompleted ? "text-emerald-600" : "text-zinc-400"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Render phase based on step state */}
      <div className="pt-4 transition-all duration-300">
        {activeTab === "history" && (phase === "select_program" || phase === "view_courses") ? (
          <ImportProposalsHistory selectedMajor={selectedMajor} />
        ) : (
          <>
            {phase === "select_program" && (
          <ProgramSelector
            uniqueMajors={uniqueMajors}
            selectedMajor={selectedMajor}
            setSelectedMajor={setSelectedMajor}
            selectedProgramId={selectedProgramId}
            setSelectedProgramId={setSelectedProgramId}
            filteredPrograms={filteredPrograms}
            isMajorDisabled={user?.role === "ADVISOR" && !!currentAdvisor?.department}
            onNext={() => setPhase("view_courses")}
          />
        )}

        {phase === "view_courses" && (
          <CurriculumCoursesView
            programId={selectedProgramId}
            selectedProgramDetails={selectedProgramDetails}
            onBack={() => setPhase("select_program")}
            onImport={() => setPhase("upload")}
          />
        )}

        {phase === "upload" && (
          <UploadPhase
            selectedProgramDetails={selectedProgramDetails}
            onBack={() => setPhase("view_courses")}
            onSubmit={handleStartUpload}
          />
        )}

        {phase === "streaming" && (
          <StreamingPhase
            streamStatus={streamStatus}
            logs={logs}
            progress={progress}
            onCancel={handleCancelImport}
          />
        )}

        {phase === "conflict_resolution" && (
          <ConflictResolutionPhase
            conflicts={conflicts}
            previewCourses={previewCourses}
            onCancel={handleCancelImport}
            onConfirm={handleConfirmConflicts}
            sheets={sheetsList}
            activeSheetIndex={activeSheetIndex}
            onSheetChange={handleSheetChange}
          />
        )}

        {phase === "preview" && (
          <PreviewPhase
            previewCourses={previewCourses}
            previewWarnings={previewWarnings}
            submittingImport={submittingImport}
            onConfirmFinal={handleConfirmFinalImport}
            onCancel={handleCancelImport}
            sheets={sheetsList}
            activeSheetIndex={activeSheetIndex}
            onSheetChange={handleSheetChange}
          />
        )}
      </>
    )}
  </div>
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
