import React, { useState, useMemo } from "react";
import { AlertTriangle, Loader2, XCircle, ShieldCheck, Search, Filter } from "lucide-react";
import { CoursePreviewItem } from "./ConflictResolutionPhase";
import CurriculumSheetSelector from "./CurriculumSheetSelector";

export interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface PreviewPhaseProps {
  previewCourses: CoursePreviewItem[];
  previewWarnings: WarningItem[];
  submittingImport: boolean;
  onConfirmFinal: (selectedCourses: CoursePreviewItem[]) => Promise<void>;
  onCancel: () => void;
  sheets?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
}

export default function PreviewPhase({
  previewCourses,
  previewWarnings,
  submittingImport,
  onConfirmFinal,
  onCancel,
  sheets,
  activeSheetIndex,
  onSheetChange
}: PreviewPhaseProps) {
  const [selectedPreviewCodes, setSelectedPreviewCodes] = useState<Set<string>>(
    new Set(previewCourses.map((c) => c.courseCode))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState("");

  // Filter courses by search query and knowledge block filter
  const filteredCourses = useMemo(() => {
    return previewCourses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        c.courseCode.toLowerCase().includes(q) ||
        c.courseName.toLowerCase().includes(q);

      const matchesBlock = !selectedBlockFilter || c.knowledgeBlock === selectedBlockFilter;

      return matchesSearch && matchesBlock;
    });
  }, [previewCourses, searchQuery, selectedBlockFilter]);

  const handleToggleSelectAll = () => {
    if (selectedPreviewCodes.size === filteredCourses.length) {
      // Unselect only the currently filtered courses
      const next = new Set(selectedPreviewCodes);
      filteredCourses.forEach((c) => next.delete(c.courseCode));
      setSelectedPreviewCodes(next);
    } else {
      // Select all currently filtered courses
      const next = new Set(selectedPreviewCodes);
      filteredCourses.forEach((c) => next.add(c.courseCode));
      setSelectedPreviewCodes(next);
    }
  };

  const handleToggleSelect = (code: string) => {
    const next = new Set(selectedPreviewCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedPreviewCodes(next);
  };

  const handleConfirm = () => {
    const selected = previewCourses.filter((c) => selectedPreviewCodes.has(c.courseCode));
    onConfirmFinal(selected);
  };

  const getKnowledgeBlockBadge = (block?: string | null) => {
    const defaultStyle = "bg-neutral-50 text-neutral-600 border-neutral-100";
    if (!block) return <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${defaultStyle}`}>Chưa phân loại</span>;
    
    switch (block) {
      case "GENERAL":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-100 bg-blue-50/50 text-blue-700">Đại cương</span>;
      case "SECTOR_CORE":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-orange-100 bg-orange-50/50 text-orange-700">Cơ sở khối ngành</span>;
      case "MAJOR_CORE":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-purple-100 bg-purple-50/50 text-purple-700">Cơ sở ngành</span>;
      case "SPECIALIZED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 bg-emerald-50/50 text-emerald-700">Chuyên ngành</span>;
      default:
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${defaultStyle}`}>{block}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sheet Selector */}
      {sheets && sheets.length > 1 && onSheetChange && (
        <CurriculumSheetSelector
          sheets={sheets}
          activeSheetIndex={activeSheetIndex || 0}
          onSheetSelect={onSheetChange}
        />
      )}

      {/* Success banner */}
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 backdrop-blur-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 shadow-sm">
        <div>
          <p className="text-sm font-extrabold text-emerald-900 tracking-wide">
            Bóc tách dữ liệu khung chương trình học tập hoàn tất!
          </p>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            Dữ liệu học phần đã được chuẩn hóa và đối soát. Vui lòng chọn các học phần muốn đồng bộ hóa vào cơ sở dữ liệu.
          </p>
        </div>
        <div className="shrink-0 font-bold bg-emerald-100/70 border border-emerald-200 px-4 py-2 rounded-2xl text-xs text-emerald-850">
          Đã chọn: <span className="font-mono text-sm font-extrabold">{selectedPreviewCodes.size}</span> / {previewCourses.length} môn học
        </div>
      </div>

      {/* Warnings Panel */}
      {previewWarnings.length > 0 && (
        <div className="bg-amber-50/60 backdrop-blur-xs border border-amber-200 rounded-3xl p-5 space-y-3 relative z-10">
          <span className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700"><AlertTriangle size={12} /></div>
            Chú ý: Phát hiện {previewWarnings.length} cảnh báo phân tích cú pháp dữ liệu
          </span>
          <div className="divide-y divide-amber-100/70 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
            {previewWarnings.map((w, idx) => (
              <p key={idx} className="text-[10px] text-amber-750 py-2 font-semibold leading-relaxed font-mono">
                Dòng {w.rowNumber || "?"}: {w.message} {w.rawValue ? `(Giá trị: "${w.rawValue}")` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar for preview tables */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white/95 backdrop-blur-md p-4 border border-zinc-200 rounded-2xl shadow-sm relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh mã môn, tên học phần..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
            <Filter size={14} className="text-neutral-500" />
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
            >
              <option value="">Tất cả khối kiến thức</option>
              <option value="GENERAL">Đại cương</option>
              <option value="SECTOR_CORE">Cơ sở khối ngành</option>
              <option value="MAJOR_CORE">Cơ sở ngành</option>
              <option value="SPECIALIZED">Chuyên ngành</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Table Card */}
      <div className="bg-white/95 backdrop-blur-md border border-zinc-200 rounded-3xl shadow-xl overflow-hidden relative z-10 transition-all duration-300 hover:shadow-2xl">
        <div className="overflow-x-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-zinc-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 sticky top-0 backdrop-blur-xs text-neutral-500 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider select-none z-10 shadow-xs">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredCourses.length > 0 && filteredCourses.every((c) => selectedPreviewCodes.has(c.courseCode))}
                    onChange={handleToggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 border-zinc-300 cursor-pointer transition"
                  />
                </th>
                <th className="px-6 py-4">Mã môn</th>
                <th className="px-6 py-4">Tên học phần</th>
                <th className="px-6 py-4 text-center">Tín chỉ</th>
                <th className="px-6 py-4">Khối kiến thức</th>
                <th className="px-6 py-4">Loại môn</th>
                <th className="px-6 py-4 text-center">Học kỳ dự kiến</th>
                <th className="px-6 py-4">Môn tiên quyết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 font-semibold text-neutral-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 text-neutral-450 italic">
                    Không tìm thấy học phần nào khớp với bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((c, index) => {
                  const isSelected = selectedPreviewCodes.has(c.courseCode);
                  return (
                    <tr
                      key={`${c.courseCode}-${index}`}
                      onClick={() => handleToggleSelect(c.courseCode)}
                      className={`hover:bg-neutral-50/60 transition-colors cursor-pointer select-none ${
                        isSelected ? "bg-emerald-50/10" : "opacity-55 bg-neutral-50/20"
                      }`}
                    >
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(c.courseCode)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5 border-zinc-300 cursor-pointer transition"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                        {c.courseCode}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-neutral-900">
                        {c.courseName}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-neutral-850 text-center">
                        {c.credits ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        {getKnowledgeBlockBadge(c.knowledgeBlock)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 uppercase border border-zinc-200">
                          {c.courseType === "REQUIRED" ? "Bắt buộc" : c.courseType === "ELECTIVE" ? "Tự chọn" : c.courseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-neutral-800 text-center">
                        HK {c.expectedSemester || "—"}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-450 truncate max-w-44 text-[11px]" title={c.prerequisite || ""}>
                        {c.prerequisite || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-150 relative z-10">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 border border-zinc-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-neutral-550 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-98"
        >
          <XCircle size={14} />
          Hủy bỏ &amp; Xóa phiên
        </button>
        <button
          type="button"
          disabled={submittingImport || selectedPreviewCodes.size === 0}
          onClick={handleConfirm}
          className="rounded-xl px-6 py-2.5 bg-emerald-600 hover:bg-emerald-55 active:scale-98 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50 hover:shadow-emerald-600/30 cursor-pointer"
        >
          {submittingImport ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Đang lưu dữ liệu học thuật...
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              Đồng bộ dữ liệu ({selectedPreviewCodes.size} học phần)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
