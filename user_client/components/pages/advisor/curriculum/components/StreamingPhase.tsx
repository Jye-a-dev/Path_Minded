import React, { useEffect, useRef } from "react";
import { Loader2, CheckCircle, Terminal } from "lucide-react";

export interface LogItem {
  type: "info" | "progress" | "warning" | "error" | "success";
  text: string;
  timestamp: string;
}

interface StreamingPhaseProps {
  streamStatus: "connecting" | "processing" | "completed" | "error";
  logs: LogItem[];
  progress: { current: number; total: number };
  onCancel: () => void;
}

export default function StreamingPhase({
  streamStatus,
  logs,
  progress,
  onCancel
}: StreamingPhaseProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
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
        <div className="rounded-xl border border-zinc-200 bg-neutral-955 p-4 font-mono text-xs overflow-y-auto max-h-60 min-h-45 shadow-inner flex flex-col gap-1.5 select-text text-neutral-350">
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
          onClick={onCancel}
          className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
        >
          Hủy bỏ phiên
        </button>
      </div>
    </div>
  );
}
