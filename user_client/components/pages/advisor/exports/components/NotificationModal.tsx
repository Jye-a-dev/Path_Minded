"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

export interface NotificationData {
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

interface NotificationModalProps {
  notification: NotificationData | null;
  onClose: () => void;
}

export default function NotificationModal({
  notification,
  onClose,
}: NotificationModalProps) {
  if (!notification) return null;

  const getTheme = () => {
    switch (notification.type) {
      case "error":
        return {
          textClass: "text-rose-600",
          bgBtnClass: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10",
          icon: <AlertCircle className="text-rose-600 h-5 w-5 shrink-0" />
        };
      case "info":
        return {
          textClass: "text-blue-600",
          bgBtnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10",
          icon: <Info className="text-blue-600 h-5 w-5 shrink-0" />
        };
      default:
        return {
          textClass: "text-emerald-600",
          bgBtnClass: "bg-emerald-600 hover:bg-emerald-55 shadow-emerald-600/10",
          icon: <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
        <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
          {theme.icon}
          <h3 className={`text-sm font-extrabold uppercase tracking-wide ${theme.textClass}`}>
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
            className={`rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white ${theme.bgBtnClass}`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
