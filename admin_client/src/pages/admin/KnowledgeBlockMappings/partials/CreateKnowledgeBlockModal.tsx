import { useState } from "react";
import { Modal } from "../../../../components/ui/Modal";
import { AlertTriangle } from "lucide-react";

interface CreateKnowledgeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { knowledge_block: string; label: string; phrases: string[] }) => Promise<unknown>;
}

export function CreateKnowledgeBlockModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateKnowledgeBlockModalProps) {
  const [newTypeCode, setNewTypeCode] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypePhrases, setNewTypePhrases] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const code = newTypeCode.trim().toUpperCase();
    const label = newTypeLabel.trim();
    if (!code || !label) {
      setActionError("Mã khối kiến thức và tên khối kiến thức không được để trống");
      return;
    }
    if (!/^[A-Z0-9_]{2,30}$/.test(code)) {
      setActionError("Mã khối phải từ 2-30 ký tự, chỉ gồm chữ in hoa, số và dấu gạch dưới");
      return;
    }

    const phrases = newTypePhrases
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    setSubmitting(true);
    setActionError(null);
    try {
      await onSubmit({ knowledge_block: code, label, phrases });
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
      title="Thêm khối kiến thức mới"
      size="md"
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
            Mã khối kiến thức <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={newTypeCode}
            onChange={(e) => {
              setNewTypeCode(e.target.value);
              setActionError(null);
            }}
            placeholder="VD: GENERAL, SECTOR_CORE, SPECIALIZED"
            disabled={submitting}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all font-mono uppercase"
          />
          <p className="text-[10px] text-slate-500 leading-normal">
            Chỉ cho phép chữ in hoa, số và dấu gạch dưới (A-Z, 0-9, _). Từ 2-30 ký tự.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tên khối kiến thức <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={newTypeLabel}
            onChange={(e) => {
              setNewTypeLabel(e.target.value);
              setActionError(null);
            }}
            placeholder="VD: Đại cương, Cơ sở ngành"
            disabled={submitting}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Từ khóa ban đầu (Phân tách bằng dấu phẩy)
          </label>
          <input
            type="text"
            value={newTypePhrases}
            onChange={(e) => {
              setNewTypePhrases(e.target.value);
              setActionError(null);
            }}
            placeholder="VD: đại cương, cơ sở ngành, chuyên sâu"
            disabled={submitting}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
          />
          <p className="text-[10px] text-slate-500 leading-normal">
            Không phân biệt hoa thường. Các từ khóa sẽ tự động chuyển thành chữ thường.
          </p>
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
            disabled={submitting || !newTypeCode.trim() || !newTypeLabel.trim()}
            onClick={handleCreate}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            {submitting ? "Đang tạo..." : "Thêm khối"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
