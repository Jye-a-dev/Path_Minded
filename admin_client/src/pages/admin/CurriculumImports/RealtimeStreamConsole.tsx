import React, { useEffect, useState, useRef } from "react";
import { Loader2, Terminal, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "../../../services/api";
import type { CoursePreviewItem, WarningItem } from "./CurriculumImports";
import type { ConflictItem } from "./ConflictResolutionCenter";

interface RealtimeStreamConsoleProps {
  importSessionId: string;
  onComplete: (data: {
    preview: CoursePreviewItem[];
    warnings: WarningItem[];
    sheets: string[];
    activeSheetIndex: number;
    conflicts: ConflictItem[];
  }) => void;
  onUnresolvedHeaders: (data: {
    rawHeaders: string[];
    potentialHeaderRow: number;
    sheets: string[];
    activeSheetIndex: number;
  }) => void;
  onCancel: () => void;
}

interface LogItem {
  type: "info" | "progress" | "warning" | "error" | "success";
  text: string;
  timestamp: string;
}

export const RealtimeStreamConsole: React.FC<RealtimeStreamConsoleProps> = ({
  importSessionId,
  onComplete,
  onUnresolvedHeaders,
  onCancel,
}) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 100 });
  const [status, setStatus] = useState<"connecting" | "processing" | "completed" | "error" | "unresolved">("connecting");
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = (type: LogItem["type"], text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { type, text, timestamp }]);
  };

  const callbacksRef = useRef({ onComplete, onUnresolvedHeaders });
  useEffect(() => {
    callbacksRef.current = { onComplete, onUnresolvedHeaders };
  }, [onComplete, onUnresolvedHeaders]);

  useEffect(() => {
    const apiBase = api.defaults.baseURL || "http://localhost:3000";
    const token = sessionStorage.getItem("admin_token") || "";
    const sseUrl = `${apiBase}/curriculum_imports/${importSessionId}/progress?token=${encodeURIComponent(token)}`;

    setTimeout(() => {
      addLog("info", "Đang khởi tạo kết nối dòng dữ liệu (SSE)...");
    }, 0);
    
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStatus("processing");
      addLog("info", "Đã thiết lập kết nối thời gian thực thành công.");
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { type, message, current, total, rawHeaders, potentialHeaderRow, sheets, activeSheetIndex, preview, warnings, conflicts } = payload;

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
          setStatus("unresolved");
          addLog("warning", "Không tìm thấy cấu trúc cột chuẩn! Đang chuyển hướng sang giao diện ánh xạ thủ công...");
          eventSource.close();
          setTimeout(() => {
            callbacksRef.current.onUnresolvedHeaders({
              rawHeaders: rawHeaders || [],
              potentialHeaderRow: potentialHeaderRow || 0,
              sheets: sheets || [],
              activeSheetIndex: activeSheetIndex || 0,
            });
          }, 1500);
        } else if (type === "completed") {
          setStatus("completed");
          setProgress({ current: total || 100, total: total || 100 });
          addLog("success", message || "Bóc tách thành công.");
          eventSource.close();
          setTimeout(() => {
            callbacksRef.current.onComplete({
              preview: preview || [],
              warnings: warnings || [],
              sheets: sheets || [],
              activeSheetIndex: activeSheetIndex || 0,
              conflicts: conflicts || [],
            });
          }, 1000);
        } else if (type === "error") {
          setStatus("error");
          addLog("error", message || "Lỗi hệ thống.");
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE payload", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error", err);
      setStatus("error");
      addLog("error", "Lỗi: Mất kết nối luồng SSE từ máy chủ.");
      eventSource.close();
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [importSessionId]);

  // Scroll to bottom of terminal
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.min(100, Math.round((progress.current / progress.total) * 100));
  };

  return (
    <div className="space-y-6 p-4">
      {/* Visual Status Indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
            {status === "processing" ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            ) : status === "completed" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : status === "error" ? (
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            ) : (
              <Terminal className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {status === "connecting" && "Đang kết nối luồng xử lý..."}
              {status === "processing" && "Đang xử lý luồng dữ liệu..."}
              {status === "completed" && "Phân tích hoàn tất!"}
              {status === "unresolved" && "Phát hiện cấu trúc cột lạ"}
              {status === "error" && "Gặp sự cố phân tích"}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
              Đường ống bóc tách tài liệu học thuật PathMinded
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">
          {progress.current}/{progress.total} học phần
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Tiến độ đối soát</span>
          <span style={{ color: "var(--primary-color)" }}>{getPercentage()}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-955 overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${getPercentage()}%`,
              backgroundColor: status === "error" ? "var(--tw-color-rose-500)" : "var(--primary-color)",
              boxShadow: `0 0 10px ${status === "error" ? "rgba(239, 68, 68, 0.4)" : "rgba(79, 70, 229, 0.4)"}`
            }}
          />
        </div>
      </div>

      {/* Terminal Console Logs */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Nhật ký hệ thống thời gian thực (Console Log)
        </label>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs overflow-y-auto max-h-60 min-h-45 shadow-inner flex flex-col gap-1.5 select-text">
          {logs.map((log, idx) => {
            let colorClass = "text-slate-400";
            if (log.type === "info") colorClass = "text-indigo-400 font-semibold";
            else if (log.type === "warning") colorClass = "text-amber-400 font-semibold";
            else if (log.type === "error") colorClass = "text-rose-400 font-bold";
            else if (log.type === "success") colorClass = "text-emerald-400 font-bold";
            else if (log.type === "progress") colorClass = "text-slate-200";

            return (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={colorClass}>{log.text}</span>
              </div>
            );
          })}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        {status === "error" ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
          >
            Hủy phiên xử lý
          </button>
        )}
      </div>
    </div>
  );
};
