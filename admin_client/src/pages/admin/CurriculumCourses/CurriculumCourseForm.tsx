import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface CourseItem {
  id: string;
  program_id: string;
  course_code: string;
  course_name: string;
  credits?: number;
  expected_semester?: number;
  course_group?: string;
  course_type: "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";
  is_required: boolean;
  sort_order?: number;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface CurriculumCourseFormProps {
  editingItem: CourseItem | null;
  onSubmit: (payload: {
    program_id: string;
    course_code: string;
    course_name: string;
    credits: number | null;
    expected_semester: number | null;
    course_group: string | null;
    course_type: "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";
    is_required: boolean;
    sort_order: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const CurriculumCourseForm: React.FC<CurriculumCourseFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
}) => {
  const [formProgramId, setFormProgramId] = useState(() => editingItem?.program_id || "");
  const [formCode, setFormCode] = useState(() => editingItem?.course_code || "");
  const [formName, setFormName] = useState(() => editingItem?.course_name || "");
  const [formCredits, setFormCredits] = useState<number | "">(
    () => editingItem?.credits ?? ""
  );
  const [formSemester, setFormSemester] = useState<number | "">(
    () => editingItem?.expected_semester ?? ""
  );
  const [formGroup, setFormGroup] = useState(() => editingItem?.course_group || "");
  const [formType, setFormType] = useState<"REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER">(
    () => editingItem?.course_type || "REQUIRED"
  );
  const [formIsRequired, setFormIsRequired] = useState(() => editingItem?.is_required ?? true);
  const [formSortOrder, setFormSortOrder] = useState<number | "">(
    () => editingItem?.sort_order ?? ""
  );

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
        console.error("Failed to load program list:", e);
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
      course_code: formCode,
      course_name: formName,
      credits: formCredits !== "" ? Number(formCredits) : null,
      expected_semester: formSemester !== "" ? Number(formSemester) : null,
      course_group: formGroup || null,
      course_type: formType,
      is_required: formIsRequired,
      sort_order: formSortOrder !== "" ? Number(formSortOrder) : null,
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
            Phân công Chương trình đào tạo
          </label>
          <select
            value={formProgramId}
            required
            onChange={(e) => setFormProgramId(e.target.value)}
            className="w-full rounded-lg border border-slate-855 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">-- Chọn chương trình --</option>
            {programsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã môn học
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: CS101"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tên môn học
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Nhập môn Khoa học Máy tính"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Số tín chỉ
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 3"
            value={formCredits}
            onChange={(e) => setFormCredits(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Học kỳ dự kiến
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 1"
            value={formSemester}
            onChange={(e) => setFormSemester(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Thứ tự sắp xếp
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 10"
            value={formSortOrder}
            onChange={(e) => setFormSortOrder(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Loại môn học
          </label>
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="REQUIRED">BẮT BUỘC</option>
            <option value="ELECTIVE">TỰ CHỌN</option>
            <option value="PE">THỂ CHẤT</option>
            <option value="ENGLISH">TIẾNG ANH</option>
            <option value="DEFENSE">QUỐC PHÒNG</option>
            <option value="OTHER">KHÁC</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Nhóm môn học
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Giáo dục đại cương"
            value={formGroup}
            onChange={(e) => setFormGroup(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1 flex flex-col justify-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-semibold select-none">
            <input
              type="checkbox"
              checked={formIsRequired}
              onChange={(e) => setFormIsRequired(e.target.checked)}
              className="rounded border-slate-850 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 bg-slate-950"
            />
            Là môn học bắt buộc
          </label>
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
          {editingItem ? "Lưu thay đổi" : "Thêm môn học"}
        </button>
      </div>
    </form>
  );
};
