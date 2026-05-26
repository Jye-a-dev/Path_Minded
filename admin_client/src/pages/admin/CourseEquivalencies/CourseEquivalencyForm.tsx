import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface EquivalencyItem {
  id: string;
  program_id: string;
  original_course_code: string;
  equivalent_course_code: string;
  note?: string;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface CourseEquivalencyFormProps {
  editingItem: EquivalencyItem | null;
  onSubmit: (payload: {
    program_id: string;
    original_course_code: string;
    equivalent_course_code: string;
    note: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const CourseEquivalencyForm: React.FC<CourseEquivalencyFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
}) => {
  const [formProgramId, setFormProgramId] = useState(() => editingItem?.program_id || "");
  const [formOriginalCode, setFormOriginalCode] = useState(() => editingItem?.original_course_code || "");
  const [formEquivalentCode, setFormEquivalentCode] = useState(
    () => editingItem?.equivalent_course_code || ""
  );
  const [formNote, setFormNote] = useState(() => editingItem?.note || "");

  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadDropdownsData = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/programs?limit=100");
        setProgramsList(
          (response.data || []).map((p: { id: string; program_code: string }) => ({
            id: p.id,
            label: p.program_code,
          }))
        );
      } catch (e) {
        console.error("Failed to load education program options:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownsData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      program_id: formProgramId,
      original_course_code: formOriginalCode,
      equivalent_course_code: formEquivalentCode,
      note: formNote || null,
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

      {loadingDropdowns ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải chương trình đào tạo...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chương trình đào tạo
          </label>
          <select
            value={formProgramId}
            required
            onChange={(e) => setFormProgramId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Chọn chương trình --</option>
            {programsList.map((p) => (
              <option className="bg-slate-900 text-slate-100" key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã môn học gốc
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: MATH101"
            value={formOriginalCode}
            onChange={(e) => setFormOriginalCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã môn học tương đương
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: MATH101_ALT"
            value={formEquivalentCode}
            onChange={(e) => setFormEquivalentCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Ghi chú thiết lập
          </label>
        <textarea
          placeholder="Cung cấp ghi chú ngắn gọn lý do tại sao môn này tương đương..."
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all h-20 resize-none"
        />
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
          {editingItem ? "Lưu thay đổi" : "Liên kết tương đương"}
        </button>
      </div>
    </form>
  );
};
