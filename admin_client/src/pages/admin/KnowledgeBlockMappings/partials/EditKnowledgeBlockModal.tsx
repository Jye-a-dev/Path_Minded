import { useState } from "react";
import { Modal } from "../../../../components/ui/Modal";
import { AlertTriangle } from "lucide-react";
import type { KnowledgeBlockMappingItem } from "../../../../hooks/useKnowledgeBlockMappings";

interface EditKnowledgeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: KnowledgeBlockMappingItem | null;
  onSubmit: (id: string, payload: { label: string }) => Promise<unknown>;
}

export function EditKnowledgeBlockModal({
  isOpen,
  onClose,
  item,
  onSubmit,
}: EditKnowledgeBlockModalProps) {
  const [editLabel, setEditLabel] = useState(() => item?.label || "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = async () => {
    if (!item) return;
    const label = editLabel.trim();
    if (!label) {
      setActionError("Tên khối không được để trống");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await onSubmit(item.id, { label });
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sửa tên khối kiến thức"
      size="sm"
    >
      <div className="space-y-4">
        {actionError && (
          <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20">
            <AlertTriangle size={12} className="shrink-0" />
            {actionError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã khối
          </label>
          <input
            type="text"
            value={item?.knowledge_block || ""}
            disabled={true}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 transition-all font-mono opacity-60 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tên khối kiến thức <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={editLabel}
            onChange={(e) => {
              setEditLabel(e.target.value);
              setActionError(null);
            }}
            placeholder="Nhập tên khối kiến thức..."
            disabled={submitting}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting || !editLabel.trim()}
            onClick={handleEdit}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? "Đang lưu..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
