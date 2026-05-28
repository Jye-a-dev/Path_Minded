import React from "react";
import { AlertTriangle } from "lucide-react";

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface CurriculumWarningListProps {
  warnings: WarningItem[];
  selectedCodes: Set<string>;
}

export const CurriculumWarningList: React.FC<CurriculumWarningListProps> = ({
  warnings,
  selectedCodes,
}) => {
  // Filter warnings to only show warnings for selected courses to be user-friendly
  const filteredWarnings = warnings.filter((w) => {
    // If warning message mentions a duplicate course code, check if that code is selected
    const duplicateMatch = w.message.match(/Duplicate course code:\s*(\S+)/);
    if (duplicateMatch && duplicateMatch[1]) {
      const code = duplicateMatch[1].toUpperCase().replace(/\s+/g, "");
      return selectedCodes.has(code);
    }
    return true;
  });

  if (filteredWarnings.length === 0) return null;

  return (
    <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-4 space-y-2 max-h-40 overflow-y-auto">
      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
        <AlertTriangle size={14} />
        Danh sách cảnh báo ({filteredWarnings.length})
      </div>
      <div className="space-y-1.5">
        {filteredWarnings.map((w, idx) => (
          <div key={idx} className="text-xs text-slate-400 font-mono">
            {w.rowNumber && <span className="text-amber-500/80 mr-1">[Dòng {w.rowNumber}]</span>}
            <span className="text-slate-300 font-semibold">{w.code}</span>: {w.message}
          </div>
        ))}
      </div>
    </div>
  );
};
