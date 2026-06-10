import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { ResultItem } from "./StudentResultsTab";

interface StudentCourseResultInlineModalProps {
  editingItem: ResultItem | null;
  studentLabel: string;
  onSave: (payload: {
    course_code: string;
    course_name: string | null;
    credits: number | null;
    score_10: number | null;
    score_4: number | null;
    letter_grade: string | null;
    status: "PASSED" | "FAILED" | "STUDYING";
    school_year: string | null;
    semester_code: string | null;
    semester_number: number | null;
    attempt_no?: number;
    is_latest?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function StudentCourseResultInlineModal({
  editingItem,
  studentLabel,
  onSave,
  onCancel
}: StudentCourseResultInlineModalProps) {
  const [courseCode, setCourseCode] = useState(editingItem?.course_code || "");
  const [courseName, setCourseName] = useState(editingItem?.course_name || "");
  const [credits, setCredits] = useState<string>(editingItem?.credits?.toString() || "");
  const [schoolYear, setSchoolYear] = useState(editingItem?.school_year || "");
  const [semesterCode, setSemesterCode] = useState(editingItem?.semester_code || "");
  const [semesterNumber, setSemesterNumber] = useState<string>(editingItem?.semester_number?.toString() || "");
  const [score10, setScore10] = useState<string>(editingItem?.score_10?.toString() || "");
  const [score4, setScore4] = useState<string>(editingItem?.score_4?.toString() || "");
  const [letterGrade, setLetterGrade] = useState(editingItem?.letter_grade || "");
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(editingItem?.status || "PASSED");
  const [attemptNo, setAttemptNo] = useState<string>(editingItem?.attempt_no?.toString() || "1");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleScore10Change = (val: string) => {
    setScore10(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      if (num >= 4.0) {
        setStatus("PASSED");
      } else {
        setStatus("FAILED");
      }

      // Auto map letter grade and GPA4
      if (num >= 9.0) { setLetterGrade("A+"); setScore4("4.0"); }
      else if (num >= 8.5) { setLetterGrade("A"); setScore4("3.8"); }
      else if (num >= 8.0) { setLetterGrade("B+"); setScore4("3.5"); }
      else if (num >= 7.0) { setLetterGrade("B"); setScore4("3.0"); }
      else if (num >= 6.5) { setLetterGrade("C+"); setScore4("2.5"); }
      else if (num >= 5.5) { setLetterGrade("C"); setScore4("2.0"); }
      else if (num >= 5.0) { setLetterGrade("D+"); setScore4("1.5"); }
      else if (num >= 4.0) { setLetterGrade("D"); setScore4("1.0"); }
      else { setLetterGrade("F"); setScore4("0"); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) {
      setErrorMsg("Mã môn học là bắt buộc.");
      return;
    }

    const val10 = score10.trim() !== "" ? parseFloat(score10) : null;
    const val4 = score4.trim() !== "" ? parseFloat(score4) : null;
    const creditsNum = credits.trim() !== "" ? parseInt(credits, 10) : null;
    const semNum = semesterNumber.trim() !== "" ? parseInt(semesterNumber, 10) : null;
    const attempt = attemptNo.trim() !== "" ? parseInt(attemptNo, 10) : 1;

    if (status !== "STUDYING") {
      if (val10 === null || isNaN(val10) || val10 < 0 || val10 > 10) {
        setErrorMsg("Điểm số hệ 10 phải là số từ 0 đến 10.");
        return;
      }
      if (val4 === null || isNaN(val4) || val4 < 0 || val4 > 4) {
        setErrorMsg("Điểm số hệ 4 phải là số từ 0 đến 4.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSave({
        course_code: courseCode.trim().toUpperCase(),
        course_name: courseName.trim() || null,
        credits: creditsNum,
        score_10: status === "STUDYING" ? null : val10,
        score_4: status === "STUDYING" ? null : val4,
        letter_grade: status === "STUDYING" ? null : letterGrade.trim().toUpperCase(),
        status,
        school_year: schoolYear.trim() || null,
        semester_code: semesterCode.trim() || null,
        semester_number: semNum,
        attempt_no: attempt
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(error.response?.data?.message || error.message || "Không lưu được điểm");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="p-6 border-b border-zinc-150 shrink-0">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            {editingItem ? "Sửa điểm kết quả học phần" : "Tạo mới kết quả điểm môn"}
          </h3>
          <p className="text-xs text-neutral-550 mt-1 font-bold">
            Mục tiêu: {studentLabel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-neutral-900 font-semibold text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-2 font-medium shrink-0">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Mã môn học <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ví dụ: ENG010"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Số tín chỉ</label>
              <input
                type="number"
                min="0"
                placeholder="Ví dụ: 3"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 shrink-0">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Tên học phần</label>
            <input
              type="text"
              placeholder="Ví dụ: Anh văn giao tiếp cơ bản"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1 shrink-0">
            <label className="text-[10px] font-bold text-neutral-455 uppercase tracking-wider block">Trạng thái môn</label>
            <select
              value={status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as "PASSED" | "FAILED" | "STUDYING")}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
            >
              <option value="PASSED">Đạt (PASSED)</option>
              <option value="FAILED">Rớt (FAILED)</option>
              <option value="STUDYING">Đang học (STUDYING)</option>
            </select>
          </div>

          {status !== "STUDYING" && (
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Điểm hệ 10</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="Ví dụ: 8.2"
                  value={score10}
                  onChange={(e) => handleScore10Change(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Điểm hệ 4</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4"
                  placeholder="3.5"
                  value={score4}
                  onChange={(e) => setScore4(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Điểm chữ</label>
                <input
                  type="text"
                  placeholder="B+"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Lần học thứ</label>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={attemptNo}
                onChange={(e) => setAttemptNo(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">HK trong CTĐT</label>
              <input
                type="number"
                min="1"
                placeholder="HK 3"
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Học kỳ Portal</label>
              <input
                type="text"
                placeholder="HK1"
                value={semesterCode}
                onChange={(e) => setSemesterCode(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1 shrink-0">
            <label className="text-[10px] font-bold text-neutral-455 uppercase tracking-wider block">Năm học Portal</label>
            <input
              type="text"
              placeholder="Ví dụ: 2023-2024"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin text-white" />}
              Lưu kết quả
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
