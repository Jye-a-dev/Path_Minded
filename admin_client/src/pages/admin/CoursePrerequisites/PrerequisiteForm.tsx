import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";

interface DropdownItem {
  id: string;
  label: string;
}

interface PrerequisiteFormProps {
  editingItem: PrerequisiteItem | null;
  defaultProgramId?: string;
  onSubmit: (payload: {
    program_id: string;
    course_code: string;
    prerequisite_course_code: string;
    prerequisite_type: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export const PrerequisiteForm: React.FC<PrerequisiteFormProps> = ({
  editingItem,
  defaultProgramId,
  onSubmit,
  onCancel,
}) => {
  const [formProgramId, setFormProgramId] = useState(() => editingItem?.program_id || defaultProgramId || "");
  const [formCourseCode, setFormCourseCode] = useState(() => editingItem?.course_code || "");
  const [formPrereqCode, setFormPrereqCode] = useState(() => editingItem?.prerequisite_course_code || "");
  const [formType, setFormType] = useState(() => editingItem?.prerequisite_type || "REQUIRED");

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
        console.error("Failed to load program options:", e);
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
    try {
      await onSubmit({
        program_id: formProgramId,
        course_code: formCourseCode,
        prerequisite_course_code: formPrereqCode,
        prerequisite_type: formType,
      });
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
          Đang tải danh sách chương trình từ cơ sở dữ liệu...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn chương trình liên kết
          </label>
          <select
            value={formProgramId}
            required
            onChange={(e) => setFormProgramId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Chọn chương trình đào tạo --</option>
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
            Mã môn học mục tiêu
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: CS102"
            value={formCourseCode}
            onChange={(e) => setFormCourseCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all uppercase font-mono font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã môn học tiên quyết
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: CS101"
            value={formPrereqCode}
            onChange={(e) => setFormPrereqCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all uppercase font-mono font-semibold"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Loại điều kiện tiên quyết
        </label>
        <select
          value={formType}
          onChange={(e) => setFormType(e.target.value as "REQUIRED" | "RECOMMENDED" | "PREVIOUS" | "OTHER")}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
        >
          <option className="bg-slate-900 text-slate-100" value="REQUIRED">BẮT BUỘC (Tiên quyết - Khóa cứng)</option>
          <option className="bg-slate-900 text-slate-100" value="PREVIOUS">ĐIỀU KIỆN HỌC TRƯỚC (Học xong rớt/đậu đều được)</option>
          <option className="bg-slate-900 text-slate-100" value="RECOMMENDED">KHUYẾN NGHỊ (Chỉ cảnh báo thông tin)</option>
          <option className="bg-slate-900 text-slate-100" value="OTHER">KHÁC</option>
        </select>
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
          {editingItem ? "Lưu thay đổi" : "Tạo liên kết"}
        </button>
      </div>
    </form>
  );
};
