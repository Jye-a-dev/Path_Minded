import React, { useState } from "react";
import { Modal } from "../../../../components/ui/Modal";

interface CreateMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    field_key: string;
    display_label: string;
    phrases: string[];
  }) => Promise<void>;
}

export const CreateMappingModal: React.FC<CreateMappingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [fieldKey, setFieldKey] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [rawPhrases, setRawPhrases] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fieldKey.trim()) {
      setValidationError("Khóa định danh (Field Key) không được để trống.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(fieldKey.trim())) {
      setValidationError("Khóa định danh chỉ được chứa chữ thường, số và dấu gạch dưới (_).");
      return;
    }
    if (!displayLabel.trim()) {
      setValidationError("Nhãn hiển thị không được để trống.");
      return;
    }

    const phrasesArray = rawPhrases
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p) => p !== "");

    setSubmitting(true);
    try {
      await onSubmit({
        field_key: fieldKey.trim(),
        display_label: displayLabel.trim(),
        phrases: phrasesArray,
      });
      onClose();
    } catch (err) {
      const errorObj = err as { message?: string } | null;
      setValidationError(errorObj?.message || "Không thể tạo cấu hình mới.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Cấu Hình Khớp Cột Mới" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            {validationError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Khóa định danh (Field Key) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. course_code, prerequisite_code, lt_hours"
            value={fieldKey}
            onChange={(e) => setFieldKey(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
          <p className="text-[10px] text-slate-500">
            Khóa phải là chữ thường viết liền không dấu, có thể dùng dấu gạch dưới (_).
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Nhãn hiển thị (Display Label) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mã môn học, Tên môn học, Lý thuyết"
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Cụm từ khóa ban đầu
          </label>
          <textarea
            placeholder="Nhập các từ khóa cách nhau bởi dấu phẩy. e.g. mã môn, mã học phần, course code"
            value={rawPhrases}
            onChange={(e) => setRawPhrases(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all resize-none"
          />
          <p className="text-[10px] text-slate-500">
            Hệ thống sẽ tự động chuyển thành chữ thường khi lưu trữ và so khớp.
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
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            {submitting ? "Đang tạo..." : "Tạo cấu hình"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
