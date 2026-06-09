import { TableProperties, Loader2, ArrowRight } from "lucide-react";

interface MatrixSelectorProps {
  loadingDropdowns: boolean;
  selectedMajor: string;
  setSelectedMajor: (val: string) => void;
  selectedProgramId: string;
  setSelectedProgramId: (val: string) => void;
  selectedClassId: string;
  handleClassChange: (classId: string) => void;
  uniqueMajors: string[];
  filteredPrograms: Array<{ id: string; program_name: string; program_code: string }>;
  filteredClasses: Array<{ id: string; label: string }>;
  activeAdvisorObj: { id: string; label: string } | undefined;
  setViewMatrix: (val: boolean) => void;
}

export function MatrixSelector({
  loadingDropdowns,
  selectedMajor,
  setSelectedMajor,
  selectedProgramId,
  setSelectedProgramId,
  selectedClassId,
  handleClassChange,
  uniqueMajors,
  filteredPrograms,
  filteredClasses,
  activeAdvisorObj,
  setViewMatrix,
}: MatrixSelectorProps) {
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
        {/* Glow effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TableProperties className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">Ma trận kiểm định</h2>
          <p className="mt-2 text-xs text-slate-400">
            Vui lòng chọn Ngành học, Chương trình đào tạo và Lớp học để xem ma trận học tập trực tuyến.
          </p>
        </div>

        {loadingDropdowns ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="mt-8 space-y-6 relative z-10">
            {/* Major Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Ngành học (Major)
              </label>
              <select
                value={selectedMajor}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setSelectedProgramId("");
                  handleClassChange("");
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
              >
                <option value="">-- Chọn ngành học --</option>
                {uniqueMajors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Program Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Chương trình đào tạo (Program)
              </label>
              <select
                disabled={!selectedMajor}
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(e.target.value);
                  handleClassChange("");
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn chương trình học --</option>
                {filteredPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.program_name} - {p.program_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Lớp học mục tiêu (Class)
              </label>
              <select
                disabled={!selectedProgramId}
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn lớp học --</option>
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolved Advisor Info */}
            {selectedClassId && (
              <div className="space-y-1.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Cố vấn học tập (CVHT)
                </span>
                <span className="text-sm font-bold text-slate-200 block">
                  {activeAdvisorObj ? activeAdvisorObj.label : "Chưa phân công cố vấn"}
                </span>
              </div>
            )}

            {/* Enter Button */}
            <button
              type="button"
              disabled={!selectedClassId}
              onClick={() => setViewMatrix(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer font-bold"
            >
              Truy cập Ma trận
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
