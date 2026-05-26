import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string;
  version?: string;
  total_credits?: number;
}

interface ProgramFormProps {
  editingItem: ProgramItem | null;
  onSubmit: (payload: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    version: string | null;
    total_credits: number | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ProgramForm: React.FC<ProgramFormProps> = ({ editingItem, onSubmit, onCancel }) => {
  const [formCode, setFormCode] = useState(() => editingItem?.program_code || "");
  const [formName, setFormName] = useState(() => editingItem?.program_name || "");
  const [formMajorName, setFormMajorName] = useState(() => editingItem?.major_name || "");
  const [formVersion, setFormVersion] = useState(() => editingItem?.version || "");
  const [formTotalCredits, setFormTotalCredits] = useState<number | "">(
    () => editingItem?.total_credits ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormCode(editingItem?.program_code || "");
    setFormName(editingItem?.program_name || "");
    setFormMajorName(editingItem?.major_name || "");
    setFormVersion(editingItem?.version || "");
    setFormTotalCredits(editingItem?.total_credits ?? "");
    setFormError(null);
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      program_code: formCode,
      program_name: formName,
      major_name: formMajorName || null,
      version: formVersion || null,
      total_credits: formTotalCredits !== "" ? Number(formTotalCredits) : null,
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Program Code
          </label>
          <input
            type="text"
            required
            placeholder="e.g. SE_2026"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Version Code
          </label>
          <input
            type="text"
            placeholder="e.g. v1.0"
            value={formVersion}
            onChange={(e) => setFormVersion(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Program Name
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Software Engineering Curriculum"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Major Name
          </label>
          <input
            type="text"
            placeholder="e.g. Software Engineering"
            value={formMajorName}
            onChange={(e) => setFormMajorName(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Credits
          </label>
          <input
            type="number"
            placeholder="e.g. 145"
            value={formTotalCredits}
            onChange={(e) => setFormTotalCredits(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
          {editingItem ? "Save Changes" : "Create Program"}
        </button>
      </div>
    </form>
  );
};
