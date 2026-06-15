import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

export interface NotificationItem {
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface NotificationModalProps {
  notification: NotificationItem | null;
  onClose: () => void;
}

export default function NotificationModal({
  notification,
  onClose
}: NotificationModalProps) {
  if (!notification) return null;

  return (
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
            onClick={onClose}
            className={`rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white ${notification.type === "success" ? "bg-emerald-600 hover:bg-emerald-55 shadow-lg shadow-emerald-600/10" : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/10"}`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
