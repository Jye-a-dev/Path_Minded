import React, { useState } from "react";
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
  onSubmit: (payload: { email: string; role: string; password?: string; display_name?: string }) => Promise<void>;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ editingItem, onSubmit, onCancel }) => {
  const [formEmail, setFormEmail] = useState(() => editingItem?.email || "");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState(() => editingItem?.role || "STUDENT");
  const [formDisplayName, setFormDisplayName] = useState(() => editingItem?.display_name || "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    if (!editingItem && !formPassword) {
      setFormError("Mật khẩu là bắt buộc đối với người dùng mới.");
      setSubmitting(false);
      return;
    }

    try {
      const payload: { email: string; role: string; password?: string; display_name?: string } = {
        email: formEmail,
        role: formRole,
        display_name: formDisplayName.trim() || undefined,
      };
      if (formPassword.trim()) {
        payload.password = formPassword;
      }
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

      {/* Display Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tên người dùng{" "}
          <span className="text-[10px] lowercase text-slate-500">(dùng để khớp với sinh viên)</span>
        </label>
        <input
          type="text"
          placeholder="Nguyễn Văn A"
          value={formDisplayName}
          onChange={(e) => setFormDisplayName(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
        <p className="text-[10px] text-slate-500">
          Nếu tên này trùng với họ và tên sinh viên, email sẽ được đồng bộ tự động khi bấm &quot;Đồng bộ email&quot;.
        </p>
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Địa chỉ Email
        </label>
        <input
          type="email"
          required
          placeholder="user@example.com"
          value={formEmail}
          onChange={(e) => setFormEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Mật khẩu {editingItem && <span className="text-[10px] lowercase text-slate-500">(để trống để giữ nguyên)</span>}
        </label>
        <input
          type="password"
          placeholder={editingItem ? "••••••••" : "Nhập mật khẩu tài khoản"}
          required={!editingItem}
          value={formPassword}
          onChange={(e) => setFormPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      {/* Role */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Vai trò tài khoản
        </label>
        <select
          value={formRole}
          onChange={(e) => setFormRole(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
        >
          <option className="bg-slate-900 text-slate-100" value="STUDENT">SINH VIÊN</option>
          <option className="bg-slate-900 text-slate-100" value="ADVISOR">CỐ VẤN HỌC TẬP</option>
          <option className="bg-slate-900 text-slate-100" value="ADMIN">QUẢN TRỊ VIÊN</option>
        </select>
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
          {editingItem ? "Lưu thay đổi" : "Tạo tài khoản"}
        </button>
      </div>
    </form>
  );
};
