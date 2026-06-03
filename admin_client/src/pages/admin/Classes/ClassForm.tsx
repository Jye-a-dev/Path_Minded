import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface ClassItem {
  id: string;
  class_code: string;
  class_name?: string;
  cohort_year?: number;
  advisor_id?: string;
  program_id?: string;
}

interface AdvisorOption {
  id: string;
  full_name: string;
}

interface ProgramOption {
  id: string;
  program_code: string;
  program_name: string;
}

interface ClassFormProps {
  editingItem: ClassItem | null;
  defaultProgramId?: string;
  defaultCohortYear?: number;
  onSubmit: (payload: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    advisor_id: string | null;
    program_id: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ClassForm: React.FC<ClassFormProps> = ({
  editingItem,
  defaultProgramId,
  defaultCohortYear,
  onSubmit,
  onCancel,
}) => {
  const [formCode, setFormCode] = useState(() => editingItem?.class_code || "");
  const [formName, setFormName] = useState(() => editingItem?.class_name || "");
  const [formCohortYear, setFormCohortYear] = useState<number | "">(
    () => editingItem?.cohort_year ?? defaultCohortYear ?? ""
  );
  const [formAdvisorId, setFormAdvisorId] = useState(() => editingItem?.advisor_id || "");
  const [formProgramId, setFormProgramId] = useState(() => editingItem?.program_id || defaultProgramId || "");
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        const [advisorsRes, programsRes] = await Promise.all([
          api.get("/advisors?limit=100"),
          api.get("/programs?limit=100"),
        ]);
        setAdvisors(advisorsRes.data || []);
        setPrograms(programsRes.data || []);
      } catch (e) {
        console.error("Failed to load associated options:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      class_code: formCode,
      class_name: formName || null,
      cohort_year: formCohortYear !== "" ? Number(formCohortYear) : null,
      advisor_id: formAdvisorId || null,
      program_id: formProgramId || null,
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
            Mã lớp học
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: SE17A"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Niên khóa
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 2023"
            value={formCohortYear}
            onChange={(e) => setFormCohortYear(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tên / Mô tả lớp học
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Kỹ thuật phần mềm K17A"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      {loadingDropdowns ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải tùy chọn chương trình học...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block min-h-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phân công Cố vấn lớp học
            </label>
            <select
              value={formAdvisorId}
              onChange={(e) => setFormAdvisorId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chưa phân công Cố vấn --</option>
              {advisors.map((adv) => (
                <option className="bg-slate-900 text-slate-100" key={adv.id} value={adv.id}>
                  {adv.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block min-h-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phân công Chương trình đào tạo
            </label>
            <select
              value={formProgramId}
              onChange={(e) => setFormProgramId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chưa phân công Chương trình --</option>
              {programs.map((prog) => (
                <option className="bg-slate-900 text-slate-100" key={prog.id} value={prog.id}>
                  {prog.program_code} - {prog.program_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

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
          {editingItem ? "Lưu thay đổi" : "Tạo lớp học"}
        </button>
      </div>
    </form>
  );
};
