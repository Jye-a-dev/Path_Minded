"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import { UploadCloud, Loader2 } from "lucide-react";

import ProgramSelector, { Program } from "./components/ProgramSelector";
import UploadPhase from "./components/UploadPhase";
import StreamingPhase, { LogItem } from "./components/StreamingPhase";
import ConflictResolutionPhase, { ConflictItem, CoursePreviewItem } from "./components/ConflictResolutionPhase";
import PreviewPhase, { WarningItem } from "./components/PreviewPhase";

export default function AdvisorCurriculumPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Flow steps: "select_program" | "upload" | "streaming" | "conflict_resolution" | "preview"
  const [phase, setPhase] = useReloadPersistentState<"select_program" | "upload" | "streaming" | "conflict_resolution" | "preview">("advisor_curriculum_phase", "select_program");

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

  const addLog = (type: LogItem["type"], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, text, timestamp }]);
  };

  const handleStartUpload = async (file: File | null, textContent: string, sheetIndex: number) => {
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
    setPhase("select_program");
    setActiveSessionId(null);
  };

  const handleConfirmConflicts = (updatedCourses: CoursePreviewItem[]) => {
    setPreviewCourses(updatedCourses);
    setPhase("preview");
  };

  const handleConfirmFinalImport = async (selectedCourses: CoursePreviewItem[]) => {
    if (!activeSessionId) return;
    setSubmittingImport(true);
    try {
      await api.post(`/curriculum_imports/${activeSessionId}/confirm`, {
        courses: selectedCourses
      });
      alert("Tải lên và chuẩn hóa khung chương trình thành công!");
      setPhase("select_program");
      setActiveSessionId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Lỗi lưu khung chương trình học");
    } finally {
      setSubmittingImport(false);
    }
  };

  // Helper values
  const uniqueMajors = Array.from(new Set(programs.map((p) => p.major_name).filter((m): m is string => !!m))).sort();
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

      {/* Page Header */}
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

      {/* Render phase based on step state */}
      {phase === "select_program" && (
        <ProgramSelector
          uniqueMajors={uniqueMajors}
          selectedMajor={selectedMajor}
          setSelectedMajor={setSelectedMajor}
          selectedProgramId={selectedProgramId}
          setSelectedProgramId={setSelectedProgramId}
          filteredPrograms={filteredPrograms}
          onNext={() => setPhase("upload")}
        />
      )}

      {phase === "upload" && (
        <UploadPhase
          selectedProgramDetails={selectedProgramDetails}
          onBack={() => setPhase("select_program")}
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
        />
      )}

      {phase === "preview" && (
        <PreviewPhase
          previewCourses={previewCourses}
          previewWarnings={previewWarnings}
          submittingImport={submittingImport}
          onConfirmFinal={handleConfirmFinalImport}
          onCancel={handleCancelImport}
        />
      )}
    </div>
  );
}
