import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface TranscriptUploadFormProps {
  onSubmit: (payload: { student_id: string; textContent: string }) => Promise<void>;
  onCancel: () => void;
}

export const TranscriptUploadForm: React.FC<TranscriptUploadFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formStudentId, setFormStudentId] = useState("");
  const [formRawText, setFormRawText] = useState("");

  const [studentsList, setStudentsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadStudents = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/students?limit=100");
        setStudentsList(
          (response.data || []).map((s: { id: string; student_code: string; full_name: string }) => ({
            id: s.id,
            label: `${s.student_code} - ${s.full_name}`,
          }))
        );
      } catch (e) {
        console.error("Failed to load student lists:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      student_id: formStudentId,
      textContent: formRawText,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Failed to submit transcript upload.");
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
          Loading student directory...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Student target
          </label>
          <select
            value={formStudentId}
            required
            onChange={(e) => setFormStudentId(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">-- Choose Student --</option>
            {studentsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Raw Transcript Text Body</span>
          <span className="text-[10px] lowercase text-slate-550">Format: course_code,letter_grade,credits</span>
        </label>
        <textarea
          placeholder="MATH101,A,3&#10;CS101,B+,3&#10;ENG102,A-,3"
          value={formRawText}
          required
          onChange={(e) => setFormRawText(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all h-40 font-mono resize-none"
        />
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
          Parse Transcript
        </button>
      </div>
    </form>
  );
};
