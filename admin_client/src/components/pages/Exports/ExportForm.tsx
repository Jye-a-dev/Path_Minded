import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface ExportFormProps {
  onSubmit: (payload: {
    class_id: string;
    program_id: string | null;
    advisor_id: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ExportForm: React.FC<ExportFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formClassId, setFormClassId] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formAdvisorId, setFormAdvisorId] = useState("");

  const [classesList, setClassesList] = useState<DropdownItem[]>([]);
  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);
  const [advisorsList, setAdvisorsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const [classesRes, programsRes, advisorsRes] = await Promise.all([
          api.get("/classes?limit=100"),
          api.get("/programs?limit=100"),
          api.get("/advisors?limit=100"),
        ]);

        setClassesList((classesRes.data || []).map((c: { id: string; class_code: string }) => ({ id: c.id, label: c.class_code })));
        setProgramsList((programsRes.data || []).map((p: { id: string; program_code: string }) => ({ id: p.id, label: p.program_code })));
        setAdvisorsList((advisorsRes.data || []).map((a: { id: string; full_name: string }) => ({ id: a.id, label: a.full_name })));
      } catch (e) {
        console.error("Failed to load export options lists:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      class_id: formClassId,
      program_id: formProgramId || null,
      advisor_id: formAdvisorId || null,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Failed to trigger export session.");
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
          Loading database options...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Target Class
            </label>
            <select
              value={formClassId}
              required
              onChange={(e) => setFormClassId(e.target.value)}
              className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option value="">-- Choose Study Class --</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Education Program (Optional Filter)
              </label>
              <select
                value={formProgramId}
                onChange={(e) => setFormProgramId(e.target.value)}
                className="w-full rounded-lg border border-slate-855 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
              >
                <option value="">-- All Programs in class --</option>
                {programsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Advisor Owner (Optional)
              </label>
              <select
                value={formAdvisorId}
                onChange={(e) => setFormAdvisorId(e.target.value)}
                className="w-full rounded-lg border border-slate-855 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
              >
                <option value="">-- No specific advisor --</option>
                {advisorsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

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
          Run Export
        </button>
      </div>
    </form>
  );
};
