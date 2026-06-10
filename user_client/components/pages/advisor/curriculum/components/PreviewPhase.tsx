import React, { useState } from "react";
import { AlertTriangle, Loader2, XCircle, ShieldCheck } from "lucide-react";
import { CoursePreviewItem } from "./ConflictResolutionPhase";

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
}

export default function PreviewPhase({
  previewCourses,
  previewWarnings,
  submittingImport,
  onConfirmFinal,
  onCancel
}: PreviewPhaseProps) {
  const [selectedPreviewCodes, setSelectedPreviewCodes] = useState<Set<string>>(
    new Set(previewCourses.map((c) => c.courseCode))
  );

  const handleToggleSelectAll = () => {
    if (selectedPreviewCodes.size === previewCourses.length) {
      setSelectedPreviewCodes(new Set());
    } else {
      setSelectedPreviewCodes(new Set(previewCourses.map((c) => c.courseCode)));
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 flex justify-between items-center flex-wrap gap-3">
        <div>
          <p className="text-sm font-bold text-emerald-850">
            Bóc tách thành công khung chương trình!
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            Vui lòng xem lại danh sách môn học dưới đây và chọn những môn cần lưu vào CSDL.
          </p>
        </div>
        <div className="text-xs text-neutral-500 font-medium">
          Đã chọn <strong className="text-emerald-700 font-bold">{selectedPreviewCodes.size}/{previewCourses.length}</strong> môn học
        </div>
      </div>

      {/* Warnings Panel */}
      {previewWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Chú ý: Phát hiện {previewWarnings.length} cảnh báo phân tích cú pháp
          </span>
          <div className="divide-y divide-amber-100 max-h-36 overflow-y-auto pr-1">
            {previewWarnings.map((w, idx) => (
              <p key={idx} className="text-[10px] text-amber-700 py-1 font-medium leading-relaxed">
                Dòng {w.rowNumber || "?"}: {w.message} {w.rawValue ? `(Giá trị: "${w.rawValue}")` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                <th className="px-5 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedPreviewCodes.size === previewCourses.length && previewCourses.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3.5">Mã môn</th>
                <th className="px-5 py-3.5">Tên học phần</th>
                <th className="px-5 py-3.5">Tín chỉ</th>
                <th className="px-5 py-3.5">Khối kiến thức</th>
                <th className="px-5 py-3.5">Loại môn</th>
                <th className="px-5 py-3.5">Học kỳ</th>
                <th className="px-5 py-3.5">Môn tiên quyết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {previewCourses.map((c, index) => {
                const isSelected = selectedPreviewCodes.has(c.courseCode);
                return (
                  <tr
                    key={`${c.courseCode}-${index}`}
                    className={`hover:bg-neutral-50/50 transition-colors text-neutral-700 ${
                      isSelected ? "" : "opacity-55 bg-neutral-50/20"
                    }`}
                  >
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(c.courseCode)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-zinc-300 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                      {c.courseCode}
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">
                      {c.courseName}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-neutral-800">
                      {c.credits ?? 0}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {c.knowledgeBlock === "GENERAL" ? "Đại cương" :
                       c.knowledgeBlock === "SECTOR_CORE" ? "Cơ sở khối ngành" :
                       c.knowledgeBlock === "MAJOR_CORE" ? "Cơ sở ngành" : "Chuyên ngành"}
                    </td>
                    <td className="px-5 py-4 text-[10px] font-bold text-neutral-500 uppercase">
                      {c.courseType}
                    </td>
                    <td className="px-5 py-4 font-mono font-medium">
                      HK {c.expectedSemester || "—"}
                    </td>
                    <td className="px-5 py-4 font-mono text-neutral-500 truncate max-w-40" title={c.prerequisite || ""}>
                      {c.prerequisite || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          <XCircle size={14} />
          Hủy bỏ &amp; Xóa phiên
        </button>
        <button
          type="button"
          disabled={submittingImport || selectedPreviewCodes.size === 0}
          onClick={handleConfirm}
          className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
        >
          {submittingImport ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Đang lưu vào DB...
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              Xác nhận Nhập vào DB ({selectedPreviewCodes.size} môn)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
