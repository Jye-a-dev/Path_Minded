import React, { useState, useEffect } from "react";
import { GraduationCap, X, Loader2, AlertCircle } from "lucide-react";

export interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  class_id?: string | null;
  program_id?: string | null;
  cohort_year?: number | null;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id?: string | null;
  active_alert_type?: "PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING" | null;
  active_alert_description?: string | null;
}

export interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
}

export interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
}

export interface UserAccount {
  id: string;
  email: string;
  role: string;
}

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    student_code: string;
    full_name: string;
    class_id: string;
    program_id: string | null;
    cohort_year: number | null;
    status: "ACTIVE" | "GRADUATED" | "DROPPED";
    user_id: string | null;
  }) => Promise<void>;
  editingItem: StudentItem | null;
  classes: ClassItem[];
  programs: ProgramItem[];
  usersList: UserAccount[];
  saving: boolean;
  error: string;
  setError: (err: string) => void;
}

export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  classes,
  programs,
  usersList,
  saving,
  error,
  setError
}: StudentModalProps) {
  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [classId, setClassId] = useState("");
  const [programId, setProgramId] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "GRADUATED" | "DROPPED">("ACTIVE");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (editingItem) {
          setStudentCode(editingItem.student_code);
          setFullName(editingItem.full_name);
          setClassId(editingItem.class_id || "");
          setProgramId(editingItem.program_id || "");
          setCohortYear(editingItem.cohort_year?.toString() || "");
          setStatus(editingItem.status);
          setUserId(editingItem.user_id || "");
        } else {
          setStudentCode("");
          setFullName("");
          setClassId(classes[0]?.id || "");
          setProgramId(programs[0]?.id || "");
          setCohortYear(new Date().getFullYear().toString());
          setStatus("ACTIVE");
          setUserId("");
        }
        setError("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingItem, classes, programs, setError]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !fullName.trim()) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    if (!classId) {
      setError("Vui lòng chọn Lớp học");
      return;
    }

    onSave({
      student_code: studentCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      class_id: classId,
      program_id: programId || null,
      cohort_year: cohortYear ? Number(cohortYear) : null,
      status,
      user_id: userId || null
    });
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
            <GraduationCap className="text-emerald-600" size={20} />
            {editingItem ? "Sửa Hồ sơ Sinh viên" : "Thêm Sinh viên mới"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Mã số sinh viên (MSSV) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: SE170233"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Niên khóa
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
              Lớp sinh viên (Chỉ lớp của bạn) <span className="text-red-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_code} - {c.class_name || "Lớp học"}
                </option>
              ))}
            </select>
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
              <option value="">Chưa chọn</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Tài khoản liên kết (E-mail)
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
            >
              <option value="">Không liên kết tài khoản</option>
              {usersList.map((usr) => (
                <option key={usr.id} value={usr.id}>
                  {usr.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Trạng thái học tập
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ACTIVE" | "GRADUATED" | "DROPPED")}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
            >
              <option value="ACTIVE">Đang học (ACTIVE)</option>
              <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
              <option value="DROPPED">Thôi học (DROPPED)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 border border-zinc-255 bg-white hover:bg-neutral-50 text-neutral-550 text-xs font-bold transition cursor-pointer"
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
