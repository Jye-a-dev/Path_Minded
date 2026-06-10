import React from "react";
import { UserCheck } from "lucide-react";

interface SyncConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SyncConfirmModal({
  isOpen,
  onClose,
  onConfirm
}: SyncConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
        <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
          <UserCheck className="text-emerald-600 h-5 w-5 shrink-0" />
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            Đồng bộ tài khoản sinh viên
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-neutral-500 leading-relaxed font-semibold">
            Hệ thống sẽ tự động ghép nối tài khoản sinh viên dựa trên tên. Bạn có muốn tiếp tục?
          </p>
        </div>
        <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            Xác nhận đồng bộ
          </button>
        </div>
      </div>
    </div>
  );
}
