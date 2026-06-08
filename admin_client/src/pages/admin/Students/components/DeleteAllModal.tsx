import { Modal } from "../../../../components/ui/Modal";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  deleteAllLoading: boolean;
  deleteAllError: string | null;
  onConfirm: () => void;
}

export function DeleteAllModal({
  isOpen,
  onClose,
  total,
  deleteAllLoading,
  deleteAllError,
  onConfirm,
}: DeleteAllModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa tất cả sinh viên"
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
          <p className="text-sm font-semibold text-rose-300">
            ⚠️ Hành động này <span className="font-black underline">không thể hoàn tác</span>.
          </p>
          <p className="mt-1.5 text-xs text-rose-400/80">
            Toàn bộ <span className="font-bold text-rose-300">{total.toLocaleString()} sinh viên</span> trong cơ sở dữ liệu sẽ bị xóa vĩnh viễn, bao gồm tất cả dữ liệu liên kết.
          </p>
        </div>

        {deleteAllError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {deleteAllError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={deleteAllLoading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={deleteAllLoading}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {deleteAllLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Xóa tất cả {total.toLocaleString()} sinh viên
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
