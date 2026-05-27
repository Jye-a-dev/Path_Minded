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
  theory_hours?: number | null;
  practice_hours?: number | null;
  project_hours?: number | null;
  internship_hours?: number | null;
  prerequisite?: string | null;
  corequisite?: string | null;
  organizing_semester?: string | null;
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
    theory_hours: number | null;
    practice_hours: number | null;
    project_hours: number | null;
    internship_hours: number | null;
    prerequisite: string | null;
    corequisite: string | null;
    organizing_semester: string | null;
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
  
  const [formTheoryHours, setFormTheoryHours] = useState<number | "">(
    () => editingItem?.theory_hours ?? ""
  );
  const [formPracticeHours, setFormPracticeHours] = useState<number | "">(
    () => editingItem?.practice_hours ?? ""
  );
  const [formProjectHours, setFormProjectHours] = useState<number | "">(
    () => editingItem?.project_hours ?? ""
  );
  const [formInternshipHours, setFormInternshipHours] = useState<number | "">(
    () => editingItem?.internship_hours ?? ""
  );
  const [formPrerequisite, setFormPrerequisite] = useState(() => editingItem?.prerequisite || "");
  const [formCorequisite, setFormCorequisite] = useState(() => editingItem?.corequisite || "");
  const [formOrganizingSemester, setFormOrganizingSemester] = useState(() => editingItem?.organizing_semester || "");

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
      theory_hours: formTheoryHours !== "" ? Number(formTheoryHours) : null,
      practice_hours: formPracticeHours !== "" ? Number(formPracticeHours) : null,
      project_hours: formProjectHours !== "" ? Number(formProjectHours) : null,
      internship_hours: formInternshipHours !== "" ? Number(formInternshipHours) : null,
      prerequisite: formPrerequisite || null,
      corequisite: formCorequisite || null,
      organizing_semester: formOrganizingSemester || null,
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

      <div className="grid grid-cols-2 gap-4 ">
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Giờ LT (Lý thuyết)
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 30"
            value={formTheoryHours}
            onChange={(e) => setFormTheoryHours(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Giờ TH (Thực hành)
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 15"
            value={formPracticeHours}
            onChange={(e) => setFormPracticeHours(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Giờ ĐA (Đồ án)
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 0"
            value={formProjectHours}
            onChange={(e) => setFormProjectHours(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Giờ TT (Thực tập)
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 0"
            value={formInternshipHours}
            onChange={(e) => setFormInternshipHours(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ĐK tiên quyết
          </label>
          <input
            type="text"
            placeholder="Mã môn học tiên quyết"
            value={formPrerequisite}
            onChange={(e) => setFormPrerequisite(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Môn học trước
          </label>
          <input
            type="text"
            placeholder="Mã môn học trước"
            value={formCorequisite}
            onChange={(e) => setFormCorequisite(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Học kỳ tổ chức
          </label>
          <input
            type="text"
            placeholder="Ví dụ: 1, 2, 3"
            value={formOrganizingSemester}
            onChange={(e) => setFormOrganizingSemester(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="REQUIRED">BẮT BUỘC</option>
            <option className="bg-slate-900 text-slate-100" value="ELECTIVE">TỰ CHỌN</option>
            <option className="bg-slate-900 text-slate-100" value="PE">THỂ CHẤT</option>
            <option className="bg-slate-900 text-slate-100" value="ENGLISH">TIẾNG ANH</option>
            <option className="bg-slate-900 text-slate-100" value="DEFENSE">QUỐC PHÒNG</option>
            <option className="bg-slate-900 text-slate-100" value="OTHER">KHÁC</option>
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
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1 flex flex-col justify-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-semibold select-none">
            <input
              type="checkbox"
              checked={formIsRequired}
              onChange={(e) => setFormIsRequired(e.target.checked)}
              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 bg-slate-900"
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
