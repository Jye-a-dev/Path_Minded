import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { Loader2 } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface ProgramItem {
  id: string;
  program_name: string;
  major_name?: string;
}

interface ClassItem {
  id: string;
  class_code: string;
}

interface TranscriptUploadFormProps {
  onSubmit: (payload: { student_id: string; textContent: string }) => Promise<void>;
  onCancel: () => void;
  studentId?: string;
  studentLabel?: string;
}

export const TranscriptUploadForm: React.FC<TranscriptUploadFormProps> = ({
  onSubmit,
  onCancel,
  studentId,
  studentLabel,
}) => {
  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentsList, setStudentsList] = useState<DropdownItem[]>([]);
  const [formStudentId, setFormStudentId] = useState(studentId || "");
  const [formRawText, setFormRawText] = useState("");

  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load programs on mount
  useEffect(() => {
    const loadPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (e) {
        console.error("Failed to load programs:", e);
      } finally {
        setLoadingPrograms(false);
      }
    };
    loadPrograms();
  }, []);

  // Load classes when major changes
  useEffect(() => {
    if (!selectedMajor) return;

    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<ClassItem[]>(`/classes?limit=100&program_id=${p.id}`)
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesList(uniqueClasses);
      } catch (e) {
        console.error("Failed to load classes:", e);
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClasses();
  }, [selectedMajor, allPrograms]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const loadStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get(`/students?limit=250&class_id=${selectedClassId}`);
        setStudentsList(
          (response.data || []).map((s: { id: string; student_code: string; full_name: string }) => ({
            id: s.id,
            label: `${s.student_code} - ${s.full_name}`,
          }))
        );
      } catch (e) {
        console.error("Failed to load students:", e);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedClassId]);

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMajor(val);
    setSelectedClassId("");
    setClassesList([]);
    setFormStudentId("");
    setStudentsList([]);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClassId(val);
    setFormStudentId("");
    setStudentsList([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      student_id: formStudentId,
      textContent: formRawText,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Gửi yêu cầu tải lên bảng điểm thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueMajors = Array.from(
    new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
          {formError}
        </div>
      )}

      {studentId ? (
        <div className="space-y-1 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Sinh viên mục tiêu
          </label>
          <span className="text-sm font-bold text-slate-200 block mt-1">
            {studentLabel || studentId}
          </span>
        </div>
      ) : (
        <>
          {/* Chọn ngành */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chọn ngành
            </label>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-2 text-slate-555 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải ngành học...
              </div>
            ) : (
              <select
                value={selectedMajor}
                onChange={handleMajorChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all"
              >
                <option className="bg-slate-900 text-slate-100" value="">-- Chọn ngành học --</option>
                {uniqueMajors.map((major) => (
                  <option className="bg-slate-900 text-slate-100" key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chọn lớp học */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chọn lớp học
            </label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 py-2 text-slate-555 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải danh sách lớp...
              </div>
            ) : (
              <select
                value={selectedClassId}
                disabled={!selectedMajor}
                onChange={handleClassChange}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option className="bg-slate-900 text-slate-100" value="">-- Chọn lớp học --</option>
                {classesList.map((c) => (
                  <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                    {c.class_code}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chọn sinh viên */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chọn sinh viên mục tiêu
            </label>
            {loadingStudents ? (
              <div className="flex items-center gap-2 py-2 text-slate-555 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải danh sách sinh viên...
              </div>
            ) : (
              <select
                value={formStudentId}
                disabled={!selectedClassId}
                required
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <option className="bg-slate-900 text-slate-100" value="">-- Chọn sinh viên --</option>
                {studentsList.map((s) => (
                  <option className="bg-slate-900 text-slate-100" key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Văn bản Bảng điểm Thô</span>
          <span className="text-[10px] lowercase text-slate-550">Định dạng: STT, Mã môn, Tên môn, Số TC, Điểm hệ 10, Hệ 4, Điểm chữ... (Phân tách bằng Tab)</span>
        </label>
        <textarea
          placeholder="Ví dụ:&#10;1&#71;ENG010012&#9;Anh văn dự bị (AV0)&#9;2&#9;&#9;&#9;MT&#10;1&#9;71ENG010000&#9;Kiểm tra tiếng Anh&#9;0&#9;8&#9;3.20&#9;B+"
          value={formRawText}
          required
          onChange={(e) => setFormRawText(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all h-40 font-mono resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting || !formStudentId}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Phân tích Bảng điểm
        </button>
      </div>
    </form>
  );
};
