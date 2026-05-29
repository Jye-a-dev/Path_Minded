import React from "react";
import { BookOpen, GitMerge, Maximize2, Minimize2 } from "lucide-react";

interface CurriculumSheetSelectorProps {
  sheets: string[];
  activeSheetIndex: number;
  loadingSheet: boolean;
  mergingSheet: boolean;
  onSheetSelect: (idx: number) => Promise<void>;
  isFullWidth: boolean;
  onToggleFullWidth?: () => void;
  showMergeDropdown: boolean;
  onToggleMergeDropdown: (show: boolean) => void;
  onPerformMerge: (idx: number) => Promise<void>;
  onPerformMergeAll?: () => Promise<void>;
}

export const CurriculumSheetSelector: React.FC<CurriculumSheetSelectorProps> = ({
  sheets,
  activeSheetIndex,
  loadingSheet,
  mergingSheet,
  onSheetSelect,
  isFullWidth,
  onToggleFullWidth,
  showMergeDropdown,
  onToggleMergeDropdown,
  onPerformMerge,
  onPerformMergeAll,
}) => {
  if (sheets.length <= 1) return null;

  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <BookOpen size={14} className="text-indigo-400" />
        Chọn Bảng tính / Sheet của Excel ({sheets.length})
      </span>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap gap-1">
          {sheets.map((sheetName, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSheetSelect(idx)}
              disabled={loadingSheet || mergingSheet}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-bold transition-all border-t border-x cursor-pointer ${
                idx === activeSheetIndex
                  ? "border-slate-700 bg-slate-800 text-white shadow-lg"
                  : "border-transparent bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* EXPAND BUTTON */}
          {onToggleFullWidth && (
            <button
              type="button"
              onClick={onToggleFullWidth}
              disabled={loadingSheet || mergingSheet}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
              title={isFullWidth ? "Thu nhỏ chiều ngang" : "Phóng to chiều ngang"}
            >
              {isFullWidth ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullWidth ? "Thu hẹp" : "Mở rộng"}</span>
            </button>
          )}

          {/* MERGE BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onToggleMergeDropdown(!showMergeDropdown)}
              disabled={loadingSheet || mergingSheet}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-650 hover:text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <GitMerge size={14} />
              Trộn cột từ Sheet khác (Database Join)
            </button>

            {/* Dropdown list of sheets to merge from */}
            {showMergeDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-850 bg-slate-900 p-4 shadow-2xl z-30 space-y-3 backdrop-blur-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chọn trang tính nguồn chứa dữ liệu Năm / Học kỳ:
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {sheets.length > 2 && onPerformMergeAll && (
                    <button
                      type="button"
                      onClick={onPerformMergeAll}
                      className="w-full text-left rounded-lg bg-indigo-600/15 hover:bg-indigo-600 border border-indigo-500/30 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white transition-all flex items-center justify-between cursor-pointer mb-1.5"
                    >
                      <span>Trộn TẤT CẢ sheet còn lại</span>
                      <span className="text-[9px] bg-indigo-550 text-white rounded px-1.5 py-0.5">n sheets</span>
                    </button>
                  )}
                  {sheets
                    .map((sheetName, idx) => ({ sheetName, idx }))
                    .filter((item) => item.idx !== activeSheetIndex)
                    .map((item) => (
                      <button
                        key={item.idx}
                        type="button"
                        onClick={() => onPerformMerge(item.idx)}
                        className="w-full text-left rounded-lg bg-slate-950/40 hover:bg-indigo-600/15 border border-slate-850 hover:border-indigo-500/30 px-3 py-2 text-xs font-medium text-slate-300 hover:text-indigo-300 transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>{item.sheetName}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 rounded px-1 py-0.5">Sheet #{item.idx + 1}</span>
                      </button>
                    ))}
                </div>
                <p className="text-[10px] text-slate-500 italic leading-normal border-t border-slate-800/60 pt-2">
                  * Hệ thống sẽ tự động đối khớp (Join) theo <strong>Mã môn học</strong> và <strong>Loại môn</strong> giữa trang tính này và trang tính được chọn để bù đắp các dữ liệu thiếu (như Học kỳ, Năm, Số giờ, Tín chỉ...).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
