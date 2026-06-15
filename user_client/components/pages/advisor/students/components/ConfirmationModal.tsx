import React from "react";
import { HelpCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "success" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  type = "info"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      text: "text-rose-600",
      bg: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10",
    },
    warning: {
      text: "text-amber-600",
      bg: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10",
    },
    success: {
      text: "text-emerald-600",
      bg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10",
    },
    info: {
      text: "text-violet-600",
      bg: "bg-violet-600 hover:bg-violet-700 shadow-violet-600/10",
    }
  };

  const activeStyle = typeStyles[type] || typeStyles.info;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
        <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
          <HelpCircle className={`${activeStyle.text} h-5 w-5 shrink-0`} />
          <h3 className={`text-sm font-extrabold ${activeStyle.text} tracking-wide uppercase`}>
            {title}
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-neutral-500 leading-relaxed font-semibold">
            {message}
          </p>
        </div>
        <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white font-bold cursor-pointer shadow-lg ${activeStyle.bg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
