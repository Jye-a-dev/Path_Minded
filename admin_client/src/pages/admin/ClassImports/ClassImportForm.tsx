import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2, UploadCloud, FileText } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface ClassImportFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export const ClassImportForm: React.FC<ClassImportFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [sourceType, setSourceType] = useState<"file" | "text">("text");
  const [formClassId, setFormClassId] = useState("");
  const [formRawCSV, setFormRawCSV] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const [classesList, setClassesList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/classes?limit=100");
        setClassesList(
          (response.data || []).map((c: { id: string; class_code: string }) => ({
            id: c.id,
            label: c.class_code,
          }))
        );
      } catch (e) {
        console.error("Failed to load classes dropdown:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("classId", formClassId);
      formData.append("class_id", formClassId); // For backwards compatibility

      if (sourceType === "file" && formFile) {
        formData.append("file", formFile);
      } else if (sourceType === "text") {
        formData.append("textContent", formRawCSV);
      } else {
        setFormError("Vui lòng tải lên tệp hoặc nhập nội dung văn bản.");
        setSubmitting(false);
        return;
      }

      await onSubmit(formData);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Gửi yêu cầu nhập sinh viên lớp học thất bại.");
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
          Đang tải danh sách lớp học đang hoạt động...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chỉ định lớp học mục tiêu
          </label>
          <select
            value={formClassId}
            required
            onChange={(e) => setFormClassId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Chọn lớp học --</option>
            {classesList.map((c) => (
              <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Loại nguồn dữ liệu
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSourceType("text")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              sourceType === "text"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText size={16} />
            Dán văn bản thô
          </button>
          <button
            type="button"
            onClick={() => setSourceType("file")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              sourceType === "file"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud size={16} />
            Tải tệp Excel lên
          </button>
        </div>
      </div>

      {sourceType === "text" ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Nội dung CSV danh sách sinh viên lớp</span>
            <span className="text-[10px] lowercase text-slate-500">Định dạng CSV: mã_sinh_viên,họ_và_tên,email</span>
          </label>
          <textarea
            placeholder="SE170001,Nguyen Van A,a@gmail.com&#10;SE170002,Nguyen Van B,b@gmail.com"
            value={formRawCSV}
            required
            onChange={(e) => setFormRawCSV(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all h-40 font-mono resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn bảng tính Excel (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            required
            onChange={(e) => setFormFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
          />
        </div>
      )}

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
          Bắt đầu phiên nhập
        </button>
      </div>
    </form>
  );
};
