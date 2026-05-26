import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  cohort_year?: number;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id?: string;
  class_id?: string;
  program_id?: string;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface StudentFormProps {
  editingItem: StudentItem | null;
  onSubmit: (payload: {
    student_code: string;
    full_name: string;
    cohort_year: number | null;
    status: "ACTIVE" | "GRADUATED" | "DROPPED";
    user_id: string | null;
    class_id: string | null;
    program_id: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ editingItem, onSubmit, onCancel }) => {
  const [formCode, setFormCode] = useState(() => editingItem?.student_code || "");
  const [formFullName, setFormFullName] = useState(() => editingItem?.full_name || "");
  const [formCohortYear, setFormCohortYear] = useState<number | "">(
    () => editingItem?.cohort_year ?? ""
  );
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "GRADUATED" | "DROPPED">(
    () => editingItem?.status || "ACTIVE"
  );
  const [formUserId, setFormUserId] = useState(() => editingItem?.user_id || "");
  const [formClassId, setFormClassId] = useState(() => editingItem?.class_id || "");
  const [formProgramId, setFormProgramId] = useState(() => editingItem?.program_id || "");

  const [studentUsers, setStudentUsers] = useState<DropdownItem[]>([]);
  const [classesList, setClassesList] = useState<DropdownItem[]>([]);
  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadDropdownsData = async () => {
      setLoadingDropdowns(true);
      try {
        const [usersRes, classesRes, programsRes] = await Promise.all([
          api.get("/users?role=STUDENT&limit=100"),
          api.get("/classes?limit=100"),
          api.get("/programs?limit=100"),
        ]);

        setStudentUsers(
          (usersRes.data || []).map((u: { id: string; email: string }) => ({
            id: u.id,
            label: u.email,
          }))
        );
        setClassesList(
          (classesRes.data || []).map((c: { id: string; class_code: string }) => ({
            id: c.id,
            label: c.class_code,
          }))
        );
        setProgramsList(
          (programsRes.data || []).map((p: { id: string; program_code: string }) => ({
            id: p.id,
            label: p.program_code,
          }))
        );
      } catch (e) {
        console.error("Failed to load student association collections:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownsData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      student_code: formCode,
      full_name: formFullName,
      cohort_year: formCohortYear !== "" ? Number(formCohortYear) : null,
      status: formStatus,
      user_id: formUserId || null,
      class_id: formClassId || null,
      program_id: formProgramId || null,
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã sinh viên
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: SE170001"
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Họ và tên
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Nguyễn Văn C"
            value={formFullName}
            onChange={(e) => setFormFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Niên khóa
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 2023"
            value={formCohortYear}
            onChange={(e) => setFormCohortYear(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Trạng thái học tập
          </label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as "ACTIVE" | "GRADUATED" | "DROPPED")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="ACTIVE">ĐANG HỌC</option>
            <option className="bg-slate-900 text-slate-100" value="GRADUATED">TỐT NGHIỆP</option>
            <option className="bg-slate-900 text-slate-100" value="DROPPED">THÔI HỌC</option>
          </select>
        </div>
      </div>

      {loadingDropdowns ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách liên kết sinh viên...
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block min-h-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Liên kết tài khoản đăng nhập
            </label>
            <select
              value={formUserId}
              onChange={(e) => setFormUserId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chưa liên kết tài khoản --</option>
              {studentUsers.map((u) => (
                <option className="bg-slate-900 text-slate-100" key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block min-h-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chọn lớp học
            </label>
            <select
              value={formClassId}
              onChange={(e) => setFormClassId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chưa phân lớp --</option>
              {classesList.map((c) => (
                <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block min-h-8 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chọn chương trình
            </label>
            <select
              value={formProgramId}
              onChange={(e) => setFormProgramId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chưa chỉ định chương trình --</option>
              {programsList.map((p) => (
                <option className="bg-slate-900 text-slate-100" key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
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
          {editingItem ? "Lưu thay đổi" : "Đăng ký sinh viên"}
        </button>
      </div>
    </form>
  );
};
