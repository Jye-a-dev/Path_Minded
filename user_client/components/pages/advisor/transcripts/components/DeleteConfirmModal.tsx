import React from "react";
import { Trash2 } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4 max-w-sm">
        <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide flex items-center gap-1">
          <Trash2 size={16} />
          {title}
        </h4>
        <p className="text-xs text-neutral-505 leading-relaxed font-semibold">
          {message}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 hover:bg-neutral-55 px-3 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
