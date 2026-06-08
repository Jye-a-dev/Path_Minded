import { FolderInput, Loader2 } from "lucide-react";

export interface ClassForMajorItem {
  id: string;
  class_code: string;
  program_id?: string;
}

interface StudentsConfigCardProps {
  loadingPrograms: boolean;
  allPrograms: { id: string; program_code: string; program_name: string; major_name?: string | null }[];
  selectedMajor: string;
  setSelectedMajor: (val: string) => void;
  selectedClassId: string;
  setSelectedClassId: (val: string) => void;
  loadingClasses: boolean;
  classesForMajor: ClassForMajorItem[];
  setClassesForMajor: (val: ClassForMajorItem[]) => void;
  setIsConfigured: (val: boolean) => void;
}

export function StudentsConfigCard({
  loadingPrograms,
  allPrograms,
  selectedMajor,
  setSelectedMajor,
  selectedClassId,
  setSelectedClassId,
  loadingClasses,
  classesForMajor,
  setClassesForMajor,
  setIsConfigured,
}: StudentsConfigCardProps) {
  const uniqueMajors = Array.from(
    new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-12">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
          <FolderInput className="text-indigo-400! h-8 w-8" />
          Quản lý Sinh viên
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành và lớp học mục tiêu.
        </p>
      </div>

      {loadingPrograms ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          Đang tải dữ liệu cấu hình hệ thống...
        </div>
      ) : (
        <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur-md space-y-6">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>

          <div className="space-y-4">
            {/* Major Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Chuyên ngành
              </label>
              <select
                value={selectedMajor}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMajor(val);
                  setSelectedClassId("");
                  if (!val) {
                    setClassesForMajor([]);
                  }
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
              >
                <option className="bg-slate-900 text-slate-400" value="">-- Chọn chuyên ngành --</option>
                {uniqueMajors.map((major) => (
                  <option className="bg-slate-900 text-white font-medium" key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Lớp học
              </label>
              {loadingClasses ? (
                <div className="flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-xl border border-slate-700 text-slate-400 text-xs">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  Đang tải danh sách lớp...
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  disabled={!selectedMajor || classesForMajor.length === 0}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-600 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <option className="bg-slate-900 text-slate-400" value="">
                    {!selectedMajor
                      ? "-- Vui lòng chọn chuyên ngành trước --"
                      : classesForMajor.length === 0
                      ? "-- Không tìm thấy lớp học nào --"
                      : "-- Chọn lớp học --"}
                  </option>
                  {classesForMajor.map((c) => (
                    <option className="bg-slate-900 text-white font-medium" key={c.id} value={c.id}>
                      {c.class_code}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedClassId) {
                setIsConfigured(true);
              }
            }}
            disabled={!selectedClassId}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer hover:-translate-y-0.5"
          >
            Vào trang quản lý
          </button>
        </div>
      )}
    </div>
  );
}
