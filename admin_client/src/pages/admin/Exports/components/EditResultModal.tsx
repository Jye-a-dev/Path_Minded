import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { MatrixPreviewData } from "../types";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";

interface EditResultModalProps {
  isOpen: boolean;
  studentName: string;
  courseName: string;
  courseCode: string;
  initialResult?: MatrixPreviewData["results"][0];
  onClose: () => void;
  onSave: (data: {
    status: "PASSED" | "FAILED" | "STUDYING";
    score_10: number | null;
    letter_grade: string | null;
    semester_number: number | null;
    school_year: string | null;
    semester_code: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving: boolean;
}

export const EditResultModal: React.FC<EditResultModalProps> = ({
  isOpen,
  studentName,
  courseName,
  courseCode,
  initialResult,
  onClose,
  onSave,
  onDelete,
  saving,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(
    initialResult?.status as "PASSED" | "FAILED" | "STUDYING" ?? "PASSED"
  );
  const [score10, setScore10] = useState<string>(
    initialResult?.score_10 !== undefined && initialResult?.score_10 !== null
      ? initialResult.score_10.toString()
      : ""
  );
  const [letterGrade, setLetterGrade] = useState<string>(initialResult?.letter_grade ?? "");
  const [semesterNumber, setSemesterNumber] = useState<string>(
    initialResult?.semester_number !== undefined && initialResult?.semester_number !== null
      ? initialResult.semester_number.toString()
      : ""
  );
  const [schoolYear, setSchoolYear] = useState<string>(initialResult?.school_year ?? "");
  const [semesterCode, setSemesterCode] = useState<string>(initialResult?.semester_code ?? "");

  // Handle score change to auto-update letter grade and status
  const handleScoreChange = (val: string) => {
    setScore10(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      // Auto-status
      if (num >= 4.0) {
        setStatus("PASSED");
      } else {
        setStatus("FAILED");
      }

      // Auto-letter grade
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

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

    await onSave({
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
      <div className="w-full max-w-md rounded-xl border-2 border-black bg-white p-6 shadow-2xl relative text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <h3 className="text-sm font-black text-black tracking-wide uppercase">
            Cập nhật kết quả học phần
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-black hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-black space-y-1 mb-4 font-semibold">
          <div>
            Sinh viên: <span className="font-black text-indigo-700 underline">{studentName}</span>
          </div>
          <div>
            Học phần: <span className="font-black">{courseCode} — {courseName}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Select */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-wider block">
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
              className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium"
            >
              <option value="PASSED">Đạt (PASSED)</option>
              <option value="FAILED">Rớt (FAILED)</option>
              <option value="STUDYING">Đang học (STUDYING)</option>
            </select>
          </div>

          {status !== "STUDYING" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Score 10 */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black uppercase tracking-wider block">
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
                  className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium"
                />
              </div>

              {/* Letter Grade */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black uppercase tracking-wider block">
                  Điểm chữ
                </label>
                <input
                  type="text"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                  placeholder="Ví dụ: A"
                  className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium uppercase"
                />
              </div>
            </div>
          )}

          {/* Semester Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-black uppercase tracking-wider block">
              Học kỳ thực tế
            </label>
            <input
              type="number"
              min="1"
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              placeholder="Ví dụ: 3"
              className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* School Year */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-black uppercase tracking-wider block">
                Năm học (Niên chế)
              </label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="Ví dụ: 2024-2025"
                className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Semester Code */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-black uppercase tracking-wider block">
                Mã học kỳ (Niên chế)
              </label>
              <input
                type="text"
                value={semesterCode}
                onChange={(e) => setSemesterCode(e.target.value)}
                placeholder="Ví dụ: HK1"
                className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black focus:border-indigo-650 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t-2 border-black">
            {initialResult?.id ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="rounded-lg border-2 border-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-black text-rose-600 shadow-xs transition cursor-pointer disabled:opacity-50"
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
                disabled={saving}
                className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-black text-black hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#ffd54f] hover:bg-[#ffca28] disabled:opacity-50 px-4 py-2 text-xs font-black text-black shadow-md transition cursor-pointer"
              >
                {saving && <Loader2 size={12} className="animate-spin text-black" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Xóa kết quả học phần"
        message={`Bạn có chắc chắn muốn xoá kết quả môn này của sinh viên ${studentName}?\n\nMôn học này sẽ được thiết lập về trạng thái trống trên ma trận.`}
        confirmText="Xóa kết quả"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={async () => {
          if (onDelete) {
            await onDelete();
          }
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
};
