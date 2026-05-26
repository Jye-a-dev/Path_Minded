import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  role: string;
  display_name?: string;
  mail?: string;
}

interface UserFormProps {
  editingItem: UserItem | null;
  onSubmit: (payload: { email: string; role: string; password?: string }) => Promise<void>;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ editingItem, onSubmit, onCancel }) => {
  const [formEmail, setFormEmail] = useState(() => editingItem?.email || "");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState(() => editingItem?.role || "STUDENT");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormEmail(editingItem?.email || "");
    setFormPassword("");
    setFormRole(editingItem?.role || "STUDENT");
    setFormError(null);
  }, [editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!editingItem && !formPassword) {
      setFormError("Password is required for new users.");
      setSubmitting(false);
      return;
    }

    try {
      const payload: { email: string; role: string; password?: string } = {
        email: formEmail,
        role: formRole,
      };
      if (formPassword.trim()) {
        payload.password = formPassword;
      }
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

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          required
          placeholder="user@example.com"
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Password {editingItem && <span className="text-[10px] lowercase text-slate-500">(leave blank to keep current)</span>}
        </label>
        <input
          type="password"
          placeholder={editingItem ? "••••••••" : "Enter account password"}
          required={!editingItem}
          value={formPassword}
          onChange={(e) => setFormPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Account Role
        </label>
        <select
          value={formRole}
          onChange={(e) => setFormRole(e.target.value)}
          className="w-full rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
        >
          <option value="STUDENT">STUDENT</option>
          <option value="ADVISOR">ADVISOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
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
          {editingItem ? "Save Changes" : "Create Account"}
        </button>
      </div>
    </form>
  );
};
