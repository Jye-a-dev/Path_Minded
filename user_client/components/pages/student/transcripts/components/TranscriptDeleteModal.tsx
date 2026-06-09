import React, { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { api } from "@/services/api";

interface TranscriptDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  onSuccess: () => void;
}

export function TranscriptDeleteModal({
  isOpen,
  onClose,
  sessionId,
  onSuccess,
}: TranscriptDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !sessionId) return null;

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await api.delete(`/transcript_uploads/${sessionId}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-950">
              Xác nhận xóa
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Thao tác này không thể hoàn tác
            </p>
          </div>
        </div>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Toàn bộ học phần đã được bóc tách từ phiên này sẽ bị xóa vĩnh viễn khỏi bảng điểm tích lũy của bạn.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-600 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}
