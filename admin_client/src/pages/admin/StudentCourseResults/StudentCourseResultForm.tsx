import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface ResultItem {
  id: string;
  student_id: string;
  course_code: string;
  course_name?: string;
  credits?: number;
  school_year?: string;
  semester_code?: string;
  semester_number?: number;
  score_10?: number;
  score_4?: number;
  letter_grade?: string;
  result_text?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
  attempt_no?: number;
  is_latest?: boolean;
  student_label?: string;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface StudentCourseResultFormProps {
  editingItem: ResultItem | null;
  onSubmit: (payload: {
    student_id: string;
    course_code: string;
    course_name: string | null;
    credits: number | null;
    school_year: string | null;
    semester_code: string | null;
    semester_number: number | null;
    score_10: number | null;
    score_4: number | null;
    letter_grade: string | null;
    status: "PASSED" | "FAILED" | "STUDYING";
    attempt_no: number | null;
    is_latest: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  studentId?: string;
  studentLabel?: string;
}

export const StudentCourseResultForm: React.FC<StudentCourseResultFormProps> = ({
  editingItem,
  onSubmit,
  onCancel,
  studentId,
  studentLabel,
}) => {
  const [formStudentId, setFormStudentId] = useState(() => studentId || editingItem?.student_id || "");
  const [formCourseCode, setFormCourseCode] = useState(() => editingItem?.course_code || "");
  const [formCourseName, setFormCourseName] = useState(() => editingItem?.course_name || "");
  const [formCredits, setFormCredits] = useState<number | "">(() => editingItem?.credits ?? "");
  const [formSchoolYear, setFormSchoolYear] = useState(() => editingItem?.school_year || "");
  const [formSemCode, setFormSemCode] = useState(() => editingItem?.semester_code || "");
  const [formSemNumber, setFormSemNumber] = useState<number | "">(() => editingItem?.semester_number ?? "");
  const [formScore10, setFormScore10] = useState<number | "">(() => editingItem?.score_10 ?? "");
  const [formScore4, setFormScore4] = useState<number | "">(() => editingItem?.score_4 ?? "");
  const [formLetter, setFormLetter] = useState(() => editingItem?.letter_grade || "");
  const [formStatus, setFormStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(
    () => editingItem?.status || "PASSED"
  );
  const [formAttemptNo, setFormAttemptNo] = useState<number | "">(() => editingItem?.attempt_no ?? 1);
  const [formIsLatest, setFormIsLatest] = useState(() => editingItem?.is_latest ?? true);

  const [studentsList, setStudentsList] = useState<DropdownItem[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId || editingItem) return;
    const loadDropdownsData = async () => {
      setLoadingDropdowns(true);
      try {
        const response = await api.get("/students?limit=100");
        setStudentsList(
          (response.data || []).map((s: { id: string; student_code: string; full_name: string }) => ({
            id: s.id,
            label: `${s.student_code} - ${s.full_name}`,
          }))
        );
      } catch (e) {
        console.error("Failed to load students associated list:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownsData();
  }, [studentId, editingItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      student_id: formStudentId,
      course_code: formCourseCode,
      course_name: formCourseName || null,
      credits: formCredits !== "" ? Number(formCredits) : null,
      school_year: formSchoolYear || null,
      semester_code: formSemCode || null,
      semester_number: formSemNumber !== "" ? Number(formSemNumber) : null,
      score_10: formScore10 !== "" ? Number(formScore10) : null,
      score_4: formScore4 !== "" ? Number(formScore4) : null,
      letter_grade: formLetter || null,
      status: formStatus,
      attempt_no: formAttemptNo !== "" ? Number(formAttemptNo) : null,
      is_latest: formIsLatest,
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

      {studentId || editingItem ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sinh viên
          </label>
          <div className="w-full rounded-lg border border-slate-800 bg-slate-800/40 px-3 py-2 text-sm text-slate-350 font-medium select-none">
            {studentLabel || (editingItem && editingItem.student_label) || formStudentId}
          </div>
        </div>
      ) : loadingDropdowns ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách sinh viên...
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn sinh viên
          </label>
          <select
            value={formStudentId}
            required
            onChange={(e) => setFormStudentId(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="">-- Chọn sinh viên --</option>
            {studentsList.map((s) => (
              <option className="bg-slate-900 text-slate-100" key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã môn học
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: CS101"
            value={formCourseCode}
            onChange={(e) => setFormCourseCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tên môn học
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Nhập môn Khoa học Máy tính"
            value={formCourseName}
            onChange={(e) => setFormCourseName(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Tín chỉ
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 3"
            value={formCredits}
            onChange={(e) => setFormCredits(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Năm học
          </label>
          <input
            type="text"
            placeholder="Ví dụ: 2023-2024"
            value={formSchoolYear}
            onChange={(e) => setFormSchoolYear(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Mã học kỳ
          </label>
          <input
            type="text"
            placeholder="Ví dụ: FALL"
            value={formSemCode}
            onChange={(e) => setFormSemCode(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Học kỳ số
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 1"
            value={formSemNumber}
            onChange={(e) => setFormSemNumber(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-605 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Điểm số (Hệ 10)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Ví dụ: 8.5"
            value={formScore10}
            onChange={(e) => setFormScore10(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Điểm trung bình (Hệ 4)
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="Ví dụ: 3.5"
            value={formScore4}
            onChange={(e) => setFormScore4(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Điểm chữ
          </label>
          <input
            type="text"
            placeholder="Ví dụ: A"
            value={formLetter}
            onChange={(e) => setFormLetter(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Lần học thứ
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 1"
            value={formAttemptNo}
            onChange={(e) => setFormAttemptNo(e.target.value !== "" ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Trạng thái đạt
          </label>
          <select
            value={formStatus}
            onChange={(e) => setFormStatus(e.target.value as "PASSED" | "FAILED" | "STUDYING")}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
          >
            <option className="bg-slate-900 text-slate-100" value="PASSED">ĐẠT</option>
            <option className="bg-slate-900 text-slate-100" value="FAILED">TRƯỢT</option>
            <option className="bg-slate-900 text-slate-100" value="STUDYING">ĐANG HỌC</option>
          </select>
        </div>

        <div className="space-y-1 flex flex-col justify-end pb-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-semibold select-none">
            <input
              type="checkbox"
              checked={formIsLatest}
              onChange={(e) => setFormIsLatest(e.target.checked)}
              className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 bg-slate-900"
            />
            Là lần học gần nhất
          </label>
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
          {editingItem ? "Lưu thay đổi" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
};
