import React, { useState } from "react";
import { Modal } from "../../../../components/ui/Modal";
import type { MappingItem } from "../../../../hooks/useCurriculumColumnMappings";

interface EditMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapping: MappingItem | null;
  onSubmit: (id: string, payload: { display_label: string; mapping_type: "CURRICULUM" | "CLASS" }) => Promise<void>;
}

export const EditMappingModal: React.FC<EditMappingModalProps> = ({
  isOpen,
  onClose,
  mapping,
  onSubmit,
}) => {
  const [displayLabel, setDisplayLabel] = useState(
    mapping ? mapping.display_label : "",
  );
  const [mappingType, setMappingType] = useState<"CURRICULUM" | "CLASS">(
    mapping ? mapping.mapping_type : "CURRICULUM"
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!mapping) return;
    if (!displayLabel.trim()) {
      setValidationError("Nhãn hiển thị không được để trống.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(mapping.id, {
        display_label: displayLabel.trim(),
        mapping_type: mappingType,
      });
      onClose();
    } catch (err) {
      const errorObj = err as { message?: string } | null;
      setValidationError(errorObj?.message || "Không thể cập nhật cấu hình.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Nhãn Hiển Thị" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            {validationError}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Khóa định danh (Field Key)
          </label>
          <input
            type="text"
            disabled
            value={mapping?.field_key || ""}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Nhãn hiển thị mới <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={displayLabel}
            onChange={(e) => setDisplayLabel(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Phân loại chức năng <span className="text-rose-500">*</span>
          </label>
          <select
            value={mappingType}
            onChange={(e) => setMappingType(e.target.value as "CURRICULUM" | "CLASS")}
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
          >
            <option value="CURRICULUM">Nhập chương trình đào tạo (CURRICULUM)</option>
            <option value="CLASS">Nhập lớp học / sinh viên (CLASS)</option>
          </select>
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
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
