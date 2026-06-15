import React from "react";
import { FileSpreadsheet } from "lucide-react";

interface CurriculumSheetSelectorProps {
  sheets: string[];
  activeSheetIndex: number;
  onSheetSelect: (idx: number) => void;
}

export default function CurriculumSheetSelector({
  sheets,
  activeSheetIndex,
  onSheetSelect
}: CurriculumSheetSelectorProps) {
  if (!sheets || sheets.length <= 1) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 border border-zinc-200 rounded-3xl shadow-sm space-y-3 relative z-10">
      <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
        <FileSpreadsheet size={13} className="text-emerald-600" />
        Chọn Trang tính Excel cần phân tích ({sheets.length} trang)
      </span>
      <div className="flex flex-wrap gap-2">
        {sheets.map((sheetName, idx) => {
          const isActive = idx === activeSheetIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSheetSelect(idx)}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all border cursor-pointer select-none active:scale-95 ${
                isActive
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                  : "border-zinc-200 bg-neutral-50/50 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {sheetName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
