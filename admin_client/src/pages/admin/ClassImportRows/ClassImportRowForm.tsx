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

      {loadingDropdowns ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách phiên nhập...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn phiên nhập lớp học
          </label>
          <select
            value={formImportId}
            required
            onChange={(e) => setFormImportId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Chọn phiên nhập --</option>
            {importsList.map((i) => (
              <option className="bg-slate-900 text-slate-100" key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Số dòng trong bảng
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 2"
            value={formRowNo}
            onChange={(e) => setFormRowNo(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã sinh viên
          </label>
          <input
            type="text"
            placeholder="Ví dụ: SE170001"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Họ và tên
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            placeholder="Ví dụ: a@gmail.com"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Trạng thái dòng
          </label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as "PENDING" | "SUCCESS" | "FAILED")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="PENDING">CHỜ XỬ LÝ</option>
            <option className="bg-slate-900 text-slate-100" value="SUCCESS">THÀNH CÔNG</option>
            <option className="bg-slate-900 text-slate-100" value="FAILED">THẤT BẠI</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chi tiết lỗi dòng
          </label>
          <input
            type="text"
            placeholder="Chi tiết thông báo lỗi..."
            value={formErrorDetails}
            onChange={(e) => setFormErrorDetails(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
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
          {editingItem ? "Lưu thay đổi" : "Tạo dòng"}
        </button>
      </div>
    </form>
  );
};
