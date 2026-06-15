import React from "react";
import { AlertCircle } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4 max-w-sm w-full animate-in zoom-in-95 duration-150">
        <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide flex items-center gap-1.5">
          <AlertCircle size={16} />
          {title}
        </h4>
        <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
          {message}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 hover:bg-neutral-50 px-3.5 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-600/10 cursor-pointer transition"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
