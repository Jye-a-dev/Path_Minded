import { useState, useEffect } from "react";
import { RefreshCw, BookOpen, ArrowRight } from "lucide-react";
import { api } from "../../../services/api";

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name: string | null;
  version: string | null;
}

interface SelectionScreenProps {
  onSelect: (programId: string) => void;
}

export const SelectionScreen: React.FC<SelectionScreenProps> = ({ onSelect }) => {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/programs?limit=200")
      .then((res) => {
        const list = res.data || [];
        setPrograms(list);

        // Extract unique majors
        const uniqueMajors = Array.from(
          new Set(
            list
              .map((p: ProgramItem) => p.major_name?.trim())
              .filter((m: string | null): m is string => !!m)
          )
        ) as string[];
        setMajors(uniqueMajors.sort());
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load programs:", err);
        setLoading(false);
      });
  }, []);

  // Filter programs based on selected major
  const filteredPrograms = programs.filter((p) => {
    if (!selectedMajor) return false;
    return p.major_name?.trim() === selectedMajor;
  });

  const handleEnter = () => {
    if (selectedProgram) {
      onSelect(selectedProgram);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[75vh]">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">

        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">Học phần khung</h2>
          <p className="mt-2 text-xs text-slate-400">
            Vui lòng chọn Ngành và Chương trình đào tạo để bắt đầu quản lý đề cương & tín chỉ học tập.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Đang tải thông tin chương trình...</span>
          </div>
        ) : (
          <div className="mt-8 space-y-6 relative z-10">
            {/* Sector / Major Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Ngành học (Major)
              </label>
              <select
                value={selectedMajor}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setSelectedProgram(""); // reset program when major changes
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
              >
                <option value="">-- Chọn ngành học --</option>
                {majors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {majors.length === 0 && (
                  <option value="default">Chương trình chung (General)</option>
                )}
              </select>
            </div>

            {/* Program Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Chương trình đào tạo (Program)
              </label>
              <select
                disabled={!selectedMajor}
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn chương trình học --</option>
                {/* If there are unique majors, show filtered. If none exist (empty majors), show all programs directly */}
                {(majors.length > 0 ? filteredPrograms : programs).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.program_name} {p.version ? `(Phiên bản ${p.version})` : ""} - {p.program_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={!selectedProgram}
              onClick={handleEnter}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer font-bold"
            >
              Truy cập Học phần khung
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
