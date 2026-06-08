import type { StudentItem } from "../../../../hooks/useStudents";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Calendar,
  FileSpreadsheet,
  FileUp
} from "lucide-react";

interface StudentDetailHeaderProps {
  selectedStudent: StudentItem | null;
  currentClassName: string;
  selectedMajor: string;
  activeTab: "results" | "uploads";
  setActiveTab: (tab: "results" | "uploads") => void;
  handleBackToStudentList: () => void;
}

export function StudentDetailHeader({
  selectedStudent,
  currentClassName,
  selectedMajor,
  activeTab,
  setActiveTab,
  handleBackToStudentList,
}: StudentDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 shadow-md">
      <div className="flex items-start gap-4">
        <button
          onClick={handleBackToStudentList}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-955/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          title="Quay lại danh sách sinh viên"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-white m-0">
              {selectedStudent?.full_name || "N/A"}
            </h2>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-350 border border-slate-700">
              {selectedStudent?.student_code || "N/A"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${
              selectedStudent?.has_grades
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {selectedStudent?.has_grades ? "Đã có điểm" : "Chưa có điểm"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen size={13} className="text-slate-500" />
              Lớp: <strong className="text-slate-300">{currentClassName}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Layers size={13} className="text-slate-500" />
              Chuyên ngành: <strong className="text-slate-300">{selectedMajor}</strong>
            </span>
            {selectedStudent?.cohort_year && (
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" />
                Khóa: <strong className="text-slate-300">{selectedStudent.cohort_year}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Selection buttons */}
      <div className="flex bg-slate-955 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "results"
              ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet size={14} />
          Kết quả học tập
        </button>
        <button
          onClick={() => setActiveTab("uploads")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === "uploads"
              ? "bg-teal-650 text-white shadow-md shadow-teal-605/15"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileUp size={14} />
          Lịch sử tải bảng điểm
        </button>
      </div>
    </div>
  );
}
