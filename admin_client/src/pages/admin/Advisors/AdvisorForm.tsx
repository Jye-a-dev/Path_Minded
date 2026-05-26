import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface AdvisorItem {
  id: string;
  user_id?: string;
  full_name: string;
  department?: string;
  email?: string;
}

interface UserDropdownItem {
  id: string;
  email: string;
}

interface AdvisorFormProps {
  editingItem: AdvisorItem | null;
  onSubmit: (payload: {
    full_name: string;
    department: string | null;
    user_id: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const AdvisorForm: React.FC<AdvisorFormProps> = ({ editingItem, onSubmit, onCancel }) => {
  const [formFullName, setFormFullName] = useState(() => editingItem?.full_name || "");
  const [formDepartment, setFormDepartment] = useState(() => editingItem?.department || "");
  const [formUserId, setFormUserId] = useState(() => editingItem?.user_id || "");
  const [advisorUsers, setAdvisorUsers] = useState<UserDropdownItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadAdvisorUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await api.get("/users?role=ADVISOR&limit=100");
        setAdvisorUsers(response.data || []);
      } catch (e) {
        console.error("Failed to load user accounts list:", e);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadAdvisorUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      full_name: formFullName,
      department: formDepartment || null,
      user_id: formUserId || null,
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

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Họ và tên
        </label>
        <input
          type="text"
          required
          placeholder="Ví dụ: TS. Nguyễn Văn A"
          value={formFullName}
          onChange={(e) => setFormFullName(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Khoa / Ban
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Khoa Công nghệ thông tin"
          value={formDepartment}
          onChange={(e) => setFormDepartment(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Liên kết tài khoản người dùng (Vai trò Cố vấn)
        </label>
        {loadingUsers ? (
          <div className="flex items-center gap-2 px-3 py-2 text-slate-500 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Đang tải tài khoản...
          </div>
        ) : (
          <select
            value={formUserId}
            onChange={(e) => setFormUserId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Không liên kết tài khoản --</option>
            {advisorUsers.map((u) => (
              <option className="bg-slate-900 text-slate-100" key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        )}
        <p className="text-[10px] text-slate-500 leading-normal mt-1">
          Lưu ý: Chỉ các tài khoản người dùng có vai trò "ADVISOR" (Cố vấn) mới xuất hiện ở đây. Bạn có thể định cấu hình tài khoản người dùng trong Danh mục người dùng.
        </p>
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
          {editingItem ? "Lưu thay đổi" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};
