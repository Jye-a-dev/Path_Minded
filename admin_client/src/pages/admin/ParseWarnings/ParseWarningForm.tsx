import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface WarningItem {
  id: string;
  source_type: string;
  source_id: string;
  row_number?: number;
  warning_code?: string;
  warning_message?: string;
  raw_value?: string;
}

interface ParseWarningFormProps {
  editingItem: WarningItem | null;
  onSubmit: (payload: {
    source_type: string;
    source_id: string;
    row_number: number | null;
    warning_code: string | null;
    warning_message: string | null;
    raw_value: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ParseWarningForm: React.FC<ParseWarningFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
}) => {
  const [formSourceType, setFormSourceType] = useState(() => editingItem?.source_type || "TRANSCRIPT");
  const [formSourceId, setFormSourceId] = useState(() => editingItem?.source_id || "");
  const [formRowNo, setFormRowNo] = useState<number | "">(() => editingItem?.row_number ?? "");
  const [formCode, setFormCode] = useState(() => editingItem?.warning_code || "");
  const [formMessage, setFormMessage] = useState(() => editingItem?.warning_message || "");
  const [formValue, setFormValue] = useState(() => editingItem?.raw_value || "");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      source_type: formSourceType,
      source_id: formSourceId,
      row_number: formRowNo !== "" ? Number(formRowNo) : null,
      warning_code: formCode || null,
      warning_message: formMessage || null,
      raw_value: formValue || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Loại nguồn
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: TRANSCRIPT"
            value={formSourceType}
            onChange={(e) => setFormSourceType(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all uppercase font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã bản ghi nguồn (UUID)
          </label>
          <input
            type="text"
            required
            placeholder="Nhập UUID của bản ghi nguồn"
            value={formSourceId}
            onChange={(e) => setFormSourceId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Số dòng trong bảng
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 5"
            value={formRowNo}
            onChange={(e) => setFormRowNo(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã cảnh báo
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: INVALID_LETTER_GRADE"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Giá trị phân tích thô
          </label>
          <input
            type="text"
            placeholder="Ví dụ: B++"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Thông điệp cảnh báo
          </label>
          <input
            type="text"
            required
            placeholder="Cung cấp mô tả rõ ràng về cảnh báo..."
            value={formMessage}
            onChange={(e) => setFormMessage(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingItem ? "Lưu thay đổi" : "Tạo cảnh báo"}
        </button>
      </div>
    </form>
  );
};
