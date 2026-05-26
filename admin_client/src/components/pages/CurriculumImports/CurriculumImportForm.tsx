import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface CurriculumImportFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export const CurriculumImportForm: React.FC<CurriculumImportFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [sourceType, setSourceType] = useState<"file" | "text">("text");
  const [formProgramId, setFormProgramId] = useState("");
  const [formTextContent, setFormTextContent] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formNote, setFormNote] = useState("");

  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=100");
        setProgramsList(
          (response.data || []).map((p: { id: string; program_code: string }) => ({
            id: p.id,
            label: p.program_code,
          }))
        );
      } catch (e) {
        console.error("Failed to load education program list:", e);
      } finally {
        setLoadingPrograms(false);
      }
    };

    loadPrograms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("program_id", formProgramId);
      formData.append("note", formNote);

      if (sourceType === "file" && formFile) {
        formData.append("file", formFile);
      } else if (sourceType === "text") {
        formData.append("textContent", formTextContent);
      } else {
        setFormError("Please upload a file or enter text content.");
        setSubmitting(false);
        return;
      }

      await onSubmit(formData);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Failed to submit import session.");
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

      {loadingPrograms ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading education programs...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Assign Education Program
          </label>
          <select
            value={formProgramId}
            required
            onChange={(e) => setFormProgramId(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">-- Choose Program --</option>
            {programsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Source Type
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSourceType("text")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              sourceType === "text"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-800 bg-slate-955 text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText size={16} />
            Paste Raw Text
          </button>
          <button
            type="button"
            disabled // Node server usually reads direct uploads, but keeping it elegant
            onClick={() => setSourceType("file")}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-955 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40 select-none"
          >
            <UploadCloud size={16} />
            Excel File Upload (Disabled)
          </button>
        </div>
      </div>

      {sourceType === "text" ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Curriculum Text Body</span>
            <span className="text-[10px] lowercase text-slate-500">CSV format: code,name,credits,semester,group,type</span>
          </label>
          <textarea
            placeholder="CS101,Introduction to Computer Science,3,1,General,REQUIRED&#10;CS102,Calculus I,3,1,General,REQUIRED"
            value={formTextContent}
            required
            onChange={(e) => setFormTextContent(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all h-36 font-mono resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Excel SpreadSheet (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFormFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-855 bg-slate-955 px-3 py-2 text-sm text-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Audit Note
        </label>
        <input
          type="text"
          placeholder="e.g. Import v1.0 standard syllabus matrix"
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
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
          Start Import Session
        </button>
      </div>
    </form>
  );
};
