import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Edit2, Check, X, Trash2 } from "lucide-react";

export interface ParsedStudentItem {
  studentCode: string;
  fullName: string;
  email: string | null;
}

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface ClassImportPreviewProps {
  students: ParsedStudentItem[];
  warnings: WarningItem[];
  onConfirm: (selectedStudents: ParsedStudentItem[]) => Promise<void>;
  onCancel: () => Promise<void>;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
}

export const ClassImportPreview: React.FC<ClassImportPreviewProps> = ({
  students: initialStudents,
  warnings,
  onConfirm,
  onCancel,
  isFullWidth = false,
  onToggleFullWidth,
}) => {
  const [students, setStudents] = useState<ParsedStudentItem[]>(initialStudents);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(
    new Set(initialStudents.map((s) => s.studentCode))
  );

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ParsedStudentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const selectedList = students.filter((s) => selectedCodes.has(s.studentCode));
      await onConfirm(selectedList);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSelect = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const handleToggleAll = () => {
    if (selectedCodes.size === students.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(students.map((s) => s.studentCode)));
    }
  };

  const handleDeleteRow = (index: number, code: string) => {
    const nextStudents = [...students];
    nextStudents.splice(index, 1);
    setStudents(nextStudents);

    const nextSelected = new Set(selectedCodes);
    nextSelected.delete(code);
    setSelectedCodes(nextSelected);
  };

  const handleStartEdit = (index: number, student: ParsedStudentItem) => {
    setEditingIndex(index);
    setEditForm({ ...student });
  };

  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const nextStudents = [...students];
    const oldItem = nextStudents[index];
    const oldCode = oldItem.studentCode;

    nextStudents[index] = { ...editForm };
    setStudents(nextStudents);

    const nextSelected = new Set(selectedCodes);
    if (nextSelected.has(oldCode)) {
      nextSelected.delete(oldCode);
      nextSelected.add(editForm.studentCode);
    }
    setSelectedCodes(nextSelected);

    setEditingIndex(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-slate-200 text-sm font-semibold block">Dữ liệu phân tích thành công</span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Đã phát hiện <strong className="text-white">{students.length}</strong> sinh viên. 
            Đã chọn <strong className="text-indigo-400">{selectedCodes.size}/{students.length}</strong> sinh viên để nhập vào DB.
          </span>
        </div>
        {onToggleFullWidth && (
          <button
            type="button"
            onClick={onToggleFullWidth}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {isFullWidth ? "Thu nhỏ" : "Phóng to"}
          </button>
        )}
      </div>

      {/* Warnings List */}
      {warnings.length > 0 && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-4 space-y-2 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={14} />
            Cảnh báo phát hiện ({warnings.length})
          </div>
          <div className="space-y-1.5">
            {warnings.map((w, idx) => (
              <div key={idx} className="text-xs text-slate-400 font-mono">
                {w.rowNumber && <span className="text-amber-500/80 mr-1">[Dòng {w.rowNumber}]</span>}
                <span className="text-slate-300 font-semibold">{w.code}</span>: {w.message}
                {w.rawValue && <span className="text-slate-500 italic ml-1">(Giá trị: "{w.rawValue}")</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Bản xem trước danh sách sinh viên ({students.length})
          </span>
          <span className="text-[10px] text-slate-500 italic">
            * Tích để chọn, nhấp bút để sửa nhanh, nhấp rác để loại khỏi danh sách
          </span>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className={`${isFullWidth ? "max-h-[58vh]" : "max-h-80"} overflow-y-auto transition-all`}>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 sticky top-0 text-slate-400 font-semibold select-none z-10">
                  <th className="px-4 py-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={students.length > 0 && selectedCodes.size === students.length}
                      onChange={handleToggleAll}
                      className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-2.5 w-12 text-center">STT</th>
                  <th className="px-4 py-2.5 w-40">Mã sinh viên</th>
                  <th className="px-4 py-2.5">Họ và tên</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5 text-center w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s, idx) => {
                  const isEditing = editingIndex === idx;
                  const isSelected = selectedCodes.has(s.studentCode);

                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "text-slate-200" : "text-slate-500 bg-slate-950/25"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-2 text-center select-none">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(s.studentCode)}
                          className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td className="px-4 py-2 text-center font-mono text-slate-500">{idx + 1}</td>

                      {isEditing && editForm ? (
                        <>
                          {/* Edit fields */}
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={editForm.studentCode}
                              onChange={(e) => setEditForm({ ...editForm, studentCode: e.target.value })}
                              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 font-mono focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={editForm.fullName}
                              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 font-semibold focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-1">
                            <input
                              type="text"
                              value={editForm.email || ""}
                              placeholder="Không có email"
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value || null })}
                              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-1 text-center flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(idx)}
                              className="rounded bg-indigo-600/35 hover:bg-indigo-600 text-indigo-200 p-1 transition-colors cursor-pointer"
                              title="Lưu"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="rounded bg-slate-800 hover:bg-slate-700 text-slate-400 p-1 transition-colors cursor-pointer"
                              title="Hủy"
                            >
                              <X size={13} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Read fields */}
                          <td className="px-4 py-2 font-mono font-bold text-indigo-400">{s.studentCode}</td>
                          <td className="px-4 py-2 font-semibold text-slate-200">{s.fullName}</td>
                          <td className="px-4 py-2 text-slate-400">{s.email || <span className="text-slate-600 italic">Chưa cấu hình</span>}</td>
                          <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx, s)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                              title="Sửa nhanh"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(idx, s.studentCode)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-850 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Loại bỏ"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={submitting}
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <XCircle size={16} />
          Hủy & Xóa phiên
        </button>
        <button
          type="button"
          disabled={submitting || selectedCodes.size === 0}
          onClick={handleConfirm}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Xác nhận Nhập vào DB ({selectedCodes.size} sinh viên)
        </button>
      </div>
    </div>
  );
};
