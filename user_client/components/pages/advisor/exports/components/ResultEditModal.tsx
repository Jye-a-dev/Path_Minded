import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { MatrixResult } from "./OnlineMatrixTable";

interface ResultEditModalProps {
  editingResult: {
    studentId: string;
    studentName: string;
    courseCode: string;
    courseName: string;
    result?: MatrixResult;
  };
  onClose: () => void;
  savingResult: boolean;
  handleSaveResult: (data: {
    status: "PASSED" | "FAILED" | "STUDYING";
    score_10: number | null;
    letter_grade: string | null;
    semester_number: number | null;
    school_year: string | null;
    semester_code: string | null;
  }) => Promise<void>;
  handleDeleteResult: () => Promise<void>;
}

export default function ResultEditModal({
  editingResult,
  onClose,
  savingResult,
  handleSaveResult,
  handleDeleteResult,
}: ResultEditModalProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(
    (editingResult.result?.status as "PASSED" | "FAILED" | "STUDYING") ?? "PASSED"
  );
  const [score10, setScore10] = useState<string>(
    editingResult.result?.score_10 !== undefined && editingResult.result?.score_10 !== null
      ? editingResult.result.score_10.toString()
      : ""
  );
  const [letterGrade, setLetterGrade] = useState<string>(editingResult.result?.letter_grade ?? "");
  const [semesterNumber, setSemesterNumber] = useState<string>(
    editingResult.result?.semester_number !== undefined && editingResult.result?.semester_number !== null
      ? editingResult.result.semester_number.toString()
      : ""
  );
  const [schoolYear, setSchoolYear] = useState<string>(editingResult.result?.school_year ?? "");
  const [semesterCode, setSemesterCode] = useState<string>(editingResult.result?.semester_code ?? "");

  const handleScoreChange = (val: string) => {
    setScore10(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      if (num >= 4.0) {
        setStatus("PASSED");
      } else {
        setStatus("FAILED");
      }

      if (num >= 9.0) setLetterGrade("A+");
      else if (num >= 8.5) setLetterGrade("A");
      else if (num >= 8.0) setLetterGrade("B+");
      else if (num >= 7.0) setLetterGrade("B");
      else if (num >= 6.5) setLetterGrade("C+");
      else if (num >= 5.5) setLetterGrade("C");
      else if (num >= 5.0) setLetterGrade("D+");
      else if (num >= 4.0) setLetterGrade("D");
      else setLetterGrade("F");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedScore = score10.trim() !== "" ? parseFloat(score10) : null;
    const parsedSemester = semesterNumber.trim() !== "" ? parseInt(semesterNumber, 10) : null;

    if (status !== "STUDYING" && parsedScore !== null && (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 10)) {
      alert("Điểm số phải nằm trong khoảng từ 0 đến 10");
      return;
    }

    if (parsedSemester !== null && (isNaN(parsedSemester) || parsedSemester < 1)) {
      alert("Học kỳ phải là số nguyên lớn hơn hoặc bằng 1");
      return;
    }

    await handleSaveResult({
      status,
      score_10: status === "STUDYING" ? null : parsedScore,
      letter_grade: status === "STUDYING" ? null : letterGrade.trim() || null,
      semester_number: parsedSemester,
      school_year: schoolYear.trim() || null,
      semester_code: semesterCode.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl relative text-neutral-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4 shrink-0">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            Cập nhật kết quả học phần
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="text-xs text-neutral-600 space-y-1 mb-4 font-bold shrink-0">
          <div>
            Sinh viên: <span className="font-extrabold text-emerald-700 underline">{editingResult.studentName}</span>
          </div>
          <div>
            Học phần: <span className="font-extrabold text-neutral-900">{editingResult.courseCode} — {editingResult.courseName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Trạng thái học tập
            </label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as "PASSED" | "FAILED" | "STUDYING";
                setStatus(newStatus);
                if (newStatus === "STUDYING") {
                  setScore10("");
                  setLetterGrade("");
                }
              }}
              className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2.5 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="PASSED">Đạt (PASSED)</option>
              <option value="FAILED">Rớt (FAILED)</option>
              <option value="STUDYING">Đang học (STUDYING)</option>
            </select>
          </div>

          {status !== "STUDYING" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                  Điểm số (Thang 10)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={score10}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  placeholder="Ví dụ: 8.5"
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                  Điểm chữ
                </label>
                <input
                  type="text"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                  placeholder="Ví dụ: A"
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all uppercase"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Học kỳ thực tế
            </label>
            <input
              type="number"
              min="1"
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              placeholder="Ví dụ: 3"
              className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                Năm học (Niên chế)
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="Ví dụ: 2024-2025"
                className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
                Mã học kỳ (Niên chế)
              </label>
              <input
                type="text"
                value={semesterCode}
                onChange={(e) => setSemesterCode(e.target.value)}
                placeholder="Ví dụ: HK1"
                className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-150 shrink-0 font-bold">
            {editingResult.result?.id ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={savingResult}
                className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs text-rose-600 transition cursor-pointer disabled:opacity-50"
              >
                Xóa kết quả
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={savingResult}
                className="rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 px-4 py-2 text-xs text-neutral-700 transition cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingResult}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 disabled:opacity-50 px-4 py-2 text-xs text-white shadow-lg transition cursor-pointer"
              >
                {savingResult && <Loader2 size={12} className="animate-spin text-white" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 rounded-2xl z-20">
            <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xl space-y-4 max-w-sm">
              <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide">Xóa kết quả học phần</h4>
              <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xoá kết quả môn này của sinh viên {editingResult.studentName}? Môn học này sẽ được thiết lập về trạng thái trống trên ma trận.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-zinc-200 hover:bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleDeleteResult();
                    setShowDeleteConfirm(false);
                  }}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
                >
                  Xóa kết quả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
