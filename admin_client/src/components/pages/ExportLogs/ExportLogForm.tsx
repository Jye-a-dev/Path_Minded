import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface LogItem {
  id: string;
  export_id: string;
  student_count?: number;
  course_count?: number;
  success_count?: number;
  warning_count?: number;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface ExportLogFormProps {
  editingItem: LogItem | null;
  onSubmit: (payload: {
    export_id: string;
    student_count: number | null;
    course_count: number | null;
    success_count: number | null;
    warning_count: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ExportLogForm: React.FC<ExportLogFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
}) => {
  const [formExportId, setFormExportId] = useState(() => editingItem?.export_id || "");
  const [formStudentCount, setFormStudentCount] = useState<number | "">(
    () => editingItem?.student_count ?? ""
  );
  const [formCourseCount, setFormCourseCount] = useState<number | "">(
    () => editingItem?.course_count ?? ""
  );
  const [formSuccessCount, setFormSuccessCount] = useState<number | "">(
    () => editingItem?.success_count ?? ""
  );
  const [formWarningCount, setFormWarningCount] = useState<number | "">(
    () => editingItem?.warning_count ?? ""
  );

  const [exportsList, setExportsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadExports = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/exports?limit=100");
        setExportsList(
          (response.data || []).map((e: { id: string; file_name: string }) => ({
            id: e.id,
            label: e.file_name,
          }))
        );
      } catch (e) {
        console.error("Failed to load export sessions list:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadExports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      export_id: formExportId,
      student_count: formStudentCount !== "" ? Number(formStudentCount) : null,
      course_count: formCourseCount !== "" ? Number(formCourseCount) : null,
      success_count: formSuccessCount !== "" ? Number(formSuccessCount) : null,
      warning_count: formWarningCount !== "" ? Number(formWarningCount) : null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Operation failed");
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
          Loading exports database...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Export Session Link
          </label>
          <select
            value={formExportId}
            required
            onChange={(e) => setFormExportId(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">-- Choose Export file --</option>
            {exportsList.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Student Count
          </label>
          <input
            type="number"
            placeholder="e.g. 50"
            value={formStudentCount}
            onChange={(e) => setFormStudentCount(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Course Count
          </label>
          <input
            type="number"
            placeholder="e.g. 40"
            value={formCourseCount}
            onChange={(e) => setFormCourseCount(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-855 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Success Row Count
          </label>
          <input
            type="number"
            placeholder="e.g. 45"
            value={formSuccessCount}
            onChange={(e) => setFormSuccessCount(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Warning Flags Count
          </label>
          <input
            type="number"
            placeholder="e.g. 5"
            value={formWarningCount}
            onChange={(e) => setFormWarningCount(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {editingItem ? "Save Changes" : "Log Export"}
        </button>
      </div>
    </form>
  );
};
