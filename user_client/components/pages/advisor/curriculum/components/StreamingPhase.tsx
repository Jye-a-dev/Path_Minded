import React, { useEffect, useRef } from "react";
import { CheckCircle, Terminal, RefreshCw, XCircle } from "lucide-react";

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

  const progressPercent = progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;

  return (
    <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-md border border-zinc-250 rounded-3xl shadow-xl p-8 space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-5 gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-500 shadow-md">
            {streamStatus === "processing" ? (
              <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
            ) : streamStatus === "completed" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
              <Terminal className="h-5 w-5 text-neutral-400" />
            )}
            {streamStatus === "processing" && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wide">
              {streamStatus === "connecting" && "Đang kết nối API..."}
              {streamStatus === "processing" && "Đang phân tích bóc tách..."}
              {streamStatus === "completed" && "Hoàn tất bóc tách dữ liệu!"}
              {streamStatus === "error" && "Có lỗi xảy ra!"}
            </h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
              Đường ống dẫn dữ liệu PathMinded SSE
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-bold bg-neutral-50 border border-zinc-200 px-3 py-1.5 rounded-xl text-neutral-600 block sm:inline-block">
            {progress.current}/{progress.total} học phần
          </span>
        </div>
      </div>

      {/* Progress Bar with glowing active states */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-750">
          <span>Tiến độ xử lý</span>
          <span className="text-emerald-700 font-mono font-extrabold">{progressPercent}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden border border-zinc-200/80 p-0.5">
          <div
            className={`h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-650 transition-all duration-300 relative ${
              streamStatus === "processing" ? "animate-pulse" : ""
            }`}
            style={{ width: `${progressPercent}%` }}
          >
            {streamStatus === "processing" && (
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            )}
          </div>
        </div>
      </div>

      {/* Custom styled Developer Console Terminal with macOS style bar */}
      <div className="space-y-2 relative z-10">
        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
          Nhật ký hệ thống (System Console logs)
        </label>
        <div className="rounded-2xl overflow-hidden border border-zinc-950 bg-zinc-950 shadow-2xl">
          {/* macOS window head bar */}
          <div className="bg-zinc-900 px-4 py-3 flex items-center justify-between border-b border-zinc-950">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider">pathminded-parser.log</div>
            <div className="w-12 h-2" />
          </div>

          {/* Terminal output */}
          <div className="p-5 font-mono text-xs overflow-y-auto max-h-64 min-h-48 flex flex-col gap-2 select-text text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="text-zinc-650 italic text-center py-12">
                Đang chờ luồng phản hồi từ máy chủ phân tích...
              </div>
            ) : (
              logs.map((log, idx) => {
                let colorClass = "text-zinc-400";
                let typePrefix = "[INFO]";
                if (log.type === "info") {
                  colorClass = "text-emerald-400";
                  typePrefix = "[INFO]";
                } else if (log.type === "warning") {
                  colorClass = "text-amber-400";
                  typePrefix = "[WARN]";
                } else if (log.type === "error") {
                  colorClass = "text-rose-400 font-bold";
                  typePrefix = "[ERR ]";
                } else if (log.type === "success") {
                  colorClass = "text-emerald-300 font-bold";
                  typePrefix = "[OK  ]";
                } else if (log.type === "progress") {
                  colorClass = "text-zinc-200";
                  typePrefix = "[PROC]";
                }

                return (
                  <div key={idx} className="flex gap-3 items-start leading-relaxed hover:bg-zinc-900/50 px-1 rounded transition-colors">
                    <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span className={`shrink-0 select-none font-bold ${
                      log.type === "error" ? "text-rose-500" : log.type === "warning" ? "text-amber-500" : "text-zinc-550"
                    }`}>{typePrefix}</span>
                    <span className={colorClass}>{log.text}</span>
                  </div>
                );
              })
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t border-zinc-150 relative z-10">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 border border-zinc-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-neutral-550 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-98"
        >
          <XCircle size={14} />
          Hủy bỏ phiên
        </button>
      </div>
    </div>
  );
}
