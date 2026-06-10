import React, { useState, useEffect } from "react";
import { Building2, X, Loader2, AlertCircle } from "lucide-react";

export interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  cohort_year: number | null;
  advisor_id: string | null;
  program_id: string | null;
}

export interface Program {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    program_id: string | null;
  }) => Promise<void>;
  editingItem: ClassItem | null;
  programs: Program[];
  currentAdvisorName: string;
  saving: boolean;
  error: string;
  setError: (err: string) => void;
}

export default function ClassModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  programs,
  currentAdvisorName,
  saving,
  error,
  setError
}: ClassModalProps) {
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const [programId, setProgramId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (editingItem) {
          setClassCode(editingItem.class_code);
          setClassName(editingItem.class_name || "");
          setCohortYear(editingItem.cohort_year?.toString() || "");
          setProgramId(editingItem.program_id || "");
        } else {
          setClassCode("");
          setClassName("");
          setCohortYear(new Date().getFullYear().toString());
          setProgramId("");
        }
        setError("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingItem, setError]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setError("Vui lòng nhập Mã lớp");
      return;
    }

    const payload = {
      class_code: classCode.trim().toUpperCase(),
      class_name: className.trim() || null,
      cohort_year: cohortYear ? Number(cohortYear) : null,
      program_id: programId || null
    };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition"
        >
          <X size={18} />
        </button>
        <div className="p-6 border-b border-zinc-150">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Building2 className="text-emerald-600" size={20} />
            {editingItem ? "Cấu hình Lớp học" : "Tạo Lớp học mới"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Mã lớp học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: SE17A"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Tên lớp học
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Kỹ thuật phần mềm K17A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Niên khóa (Cohort Year)
            </label>
            <input
              type="number"
              placeholder="Ví dụ: 2023"
              value={cohortYear}
              onChange={(e) => setCohortYear(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Cố vấn học tập (Mặc định)
            </label>
            <input
              type="text"
              disabled
              value={currentAdvisorName}
              className="w-full border border-zinc-200 bg-neutral-55 rounded-xl px-3 py-2 text-sm text-neutral-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Chương trình đào tạo
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Chưa liên kết</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
