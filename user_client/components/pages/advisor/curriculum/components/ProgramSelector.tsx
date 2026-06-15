import React from "react";
import { Layers, ChevronRight } from "lucide-react";

export interface Program {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface ProgramSelectorProps {
  uniqueMajors: string[];
  selectedMajor: string;
  setSelectedMajor: (major: string) => void;
  selectedProgramId: string;
  setSelectedProgramId: (id: string) => void;
  filteredPrograms: Program[];
  onNext: () => void;
  isMajorDisabled?: boolean;
}

export default function ProgramSelector({
  uniqueMajors,
  selectedMajor,
  setSelectedMajor,
  selectedProgramId,
  setSelectedProgramId,
  filteredPrograms,
  onNext,
  isMajorDisabled = false
}: ProgramSelectorProps) {
  return (
    <div className="max-w-md mx-auto py-10 relative">
      {/* Decorative background glow */}
      <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-2xl pointer-events-none" />

      <div className="bg-white/80 backdrop-blur-md border border-zinc-200/80 rounded-3xl shadow-xl p-8 space-y-8 relative z-10 transition-all duration-300 hover:shadow-2xl hover:border-zinc-300/80">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-linear-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/20 transform transition-transform duration-300 hover:rotate-3">
            <Layers size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Liên kết Chương trình học</h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
            Chọn Ngành học và phiên bản Khung chương trình đào tạo để bắt đầu cấu hình bóc tách dữ liệu học thuật.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider font-mono">
              Ngành học (Major)
            </label>
            <div className="relative">
              <select
                value={selectedMajor}
                disabled={isMajorDisabled}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setSelectedProgramId("");
                }}
                className={`w-full border border-zinc-200/80 rounded-xl px-4 py-3 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-neutral-800 ${
                  isMajorDisabled 
                    ? "opacity-80 bg-neutral-50/80 cursor-not-allowed border-zinc-250" 
                    : "hover:border-zinc-300"
                }`}
              >
                <option value="">-- Chọn ngành học --</option>
                {uniqueMajors.map((m) => (
                  <option key={m} value={m || ""}>
                    {m}
                  </option>
                ))}
              </select>
              {isMajorDisabled && (
                <div className="absolute right-8 top-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Cố định theo tài khoản
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider font-mono">
              Chương trình đào tạo (Program)
            </label>
            <select
              disabled={!selectedMajor}
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full border border-zinc-200/80 rounded-xl px-4 py-3 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all font-semibold text-neutral-800 disabled:opacity-50 disabled:bg-neutral-50/50 disabled:cursor-not-allowed hover:border-zinc-300"
            >
              <option value="">-- Chọn khung chương trình --</option>
              {filteredPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedProgramId}
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-55 active:scale-98 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-emerald-600/30"
          >
            Tiếp tục
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
