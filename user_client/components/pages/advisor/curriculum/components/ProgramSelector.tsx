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
}

export default function ProgramSelector({
  uniqueMajors,
  selectedMajor,
  setSelectedMajor,
  selectedProgramId,
  setSelectedProgramId,
  filteredPrograms,
  onNext
}: ProgramSelectorProps) {
  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Layers size={22} />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Liên kết Chương trình học</h2>
          <p className="text-xs text-neutral-400">
            Chọn Ngành học và phiên bản Khung chương trình đào tạo để bắt đầu.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider">
              Ngành học (Major)
            </label>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgramId("");
              }}
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Chọn ngành học --</option>
              {uniqueMajors.map((m) => (
                <option key={m} value={m || ""}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 uppercase block tracking-wider">
              Chương trình đào tạo (Program)
            </label>
            <select
              disabled={!selectedMajor}
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Tiếp tục
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
