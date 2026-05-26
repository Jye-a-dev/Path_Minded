import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface RowItem {
  id: string;
  import_id: string;
  row_number?: number;
  student_code?: string;
  full_name?: string;
  email?: string;
  row_status: "PENDING" | "SUCCESS" | "FAILED";
  row_error?: string;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface ClassImportRowFormProps {
  editingItem: RowItem | null;
  onSubmit: (payload: {
    import_id: string;
    row_number: number | null;
    student_code: string | null;
    full_name: string | null;
    email: string | null;
    row_status: "PENDING" | "SUCCESS" | "FAILED";
    row_error: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const ClassImportRowForm: React.FC<ClassImportRowFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
}) => {
  const [formImportId, setFormImportId] = useState(() => editingItem?.import_id || "");
  const [formRowNo, setFormRowNo] = useState<number | "">(() => editingItem?.row_number ?? "");
  const [formCode, setFormCode] = useState(() => editingItem?.student_code || "");
  const [formName, setFormName] = useState(() => editingItem?.full_name || "");
  const [formEmail, setFormEmail] = useState(() => editingItem?.email || "");
  const [formStatus, setFormStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">(
    () => editingItem?.row_status || "PENDING"
  );
  const [formErrorDetails, setFormErrorDetails] = useState(() => editingItem?.row_error || "");

  const [importsList, setImportsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadImports = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/class_imports?limit=100");
        setImportsList(
          (response.data || []).map((ci: { id: string; file_name: string }) => ({
            id: ci.id,
            label: ci.file_name,
          }))
        );
      } catch (e) {
        console.error("Failed to load class import sessions:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadImports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      import_id: formImportId,
      row_number: formRowNo !== "" ? Number(formRowNo) : null,
      student_code: formCode || null,
      full_name: formName || null,
      email: formEmail || null,
      row_status: formStatus,
      row_error: formErrorDetails || null,
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
          Loading import sessions...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Class Import Session
          </label>
          <select
            value={formImportId}
            required
            onChange={(e) => setFormImportId(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="">-- Choose Import Session --</option>
            {importsList.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Row Number in Sheet
          </label>
          <input
            type="number"
            placeholder="e.g. 2"
            value={formRowNo}
            onChange={(e) => setFormRowNo(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Student Code
          </label>
          <input
            type="text"
            placeholder="e.g. SE170001"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            placeholder="e.g. Nguyen Van A"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            placeholder="e.g. a@gmail.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Row Status
          </label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as "PENDING" | "SUCCESS" | "FAILED")}
            className="w-full rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Row Error Details
          </label>
          <input
            type="text"
            placeholder="Error message details..."
            value={formErrorDetails}
            onChange={(e) => setFormErrorDetails(e.target.value)}
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
          {editingItem ? "Save Changes" : "Create Row"}
        </button>
      </div>
    </form>
  );
};
