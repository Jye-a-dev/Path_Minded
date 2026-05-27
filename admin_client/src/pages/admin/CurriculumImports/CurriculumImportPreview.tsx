import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, Trash2, Edit2, Save, X, BookOpen } from "lucide-react";

interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
}

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface CurriculumImportPreviewProps {
  courses: CoursePreviewItem[];
  warnings: WarningItem[];
  sheets: string[];
  activeSheetIndex: number;
  onConfirm: (selectedCourses: CoursePreviewItem[]) => Promise<void>;
  onCancel: () => Promise<void>;
  onSheetChange: (index: number) => Promise<void>;
}

export const CurriculumImportPreview: React.FC<CurriculumImportPreviewProps> = ({
  courses: initialCourses,
  warnings,
  sheets,
  activeSheetIndex,
  onConfirm,
  onCancel,
  onSheetChange,
}) => {
  const [courses, setCourses] = useState<CoursePreviewItem[]>(initialCourses);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set(initialCourses.map((c) => c.courseCode)));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CoursePreviewItem | null>(null);

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSheetSelect = async (idx: number) => {
    if (idx === activeSheetIndex || loadingSheet) return;
    setLoadingSheet(true);
    try {
      await onSheetChange(idx);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const selectedList = courses.filter((c) => selectedCodes.has(c.courseCode));
      await onConfirm(selectedList);
    } finally {
      setSubmitting(false);
    }
  };

  // Selections
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
    if (selectedCodes.size === courses.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(courses.map((c) => c.courseCode)));
    }
  };

  // CRUD: Delete
  const handleDeleteRow = (index: number, code: string) => {
    const nextCourses = [...courses];
    nextCourses.splice(index, 1);
    setCourses(nextCourses);

    const nextSelected = new Set(selectedCodes);
    nextSelected.delete(code);
    setSelectedCodes(nextSelected);
  };

  // CRUD: Inline Edit
  const handleStartEdit = (index: number, course: CoursePreviewItem) => {
    setEditingIndex(index);
    setEditForm({ ...course });
  };

  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const nextCourses = [...courses];
    const oldCode = nextCourses[index].courseCode;
    nextCourses[index] = { ...editForm };
    setCourses(nextCourses);

    const nextSelected = new Set(selectedCodes);
    if (nextSelected.has(oldCode)) {
      nextSelected.delete(oldCode);
      nextSelected.add(editForm.courseCode);
    }
    setSelectedCodes(nextSelected);

    setEditingIndex(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

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

  return (
    <div className="space-y-6">
      {/* Sheets / Tables Tabs (Styled like gorgeous Excel tabs at the top!) */}
      {sheets.length > 1 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-400" />
            Chọn Bảng tính / Sheet của Excel ({sheets.length})
          </span>
          <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
            {sheets.map((sheetName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSheetSelect(idx)}
                disabled={loadingSheet}
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
        </div>
      )}

      {/* Loading Overlay */}
      {loadingSheet ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          Đang phân tích cú pháp Sheet "{sheets[activeSheetIndex] || "Excel"}"...
        </div>
      ) : (
        <>
          {/* Alert Summary */}
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-slate-200 text-sm font-semibold block">Dữ liệu phân tích thành công</span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Sheet đang hiển thị: <strong className="text-white">"{sheets[activeSheetIndex] || "Sheet1"}"</strong>.
                Đã chọn <strong className="text-indigo-400">{selectedCodes.size}/{courses.length}</strong> môn học.
                Phát hiện <strong className="text-amber-400">{filteredWarnings.length}</strong> cảnh báo.
              </span>
            </div>
          </div>

          {/* Warnings List */}
          {filteredWarnings.length > 0 && (
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
          )}

          {/* Preview Table */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Bản xem trước danh sách môn học ({courses.length})
              </span>
              <span className="text-[10px] text-slate-500 italic">
                * Tích để chọn môn, nhấp bút để sửa nhanh, nhấp rác để xóa khỏi phiên
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900 sticky top-0 text-slate-400 font-semibold select-none z-10">
                      <th className="px-4 py-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={courses.length > 0 && selectedCodes.size === courses.length}
                          onChange={handleToggleAll}
                          className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-2.5">Mã môn</th>
                      <th className="px-4 py-2.5">Tên môn</th>
                      <th className="px-4 py-2.5 text-center">TC</th>
                      <th className="px-4 py-2.5 text-center">LT</th>
                      <th className="px-4 py-2.5 text-center">TH</th>
                      <th className="px-4 py-2.5 text-center">ĐA</th>
                      <th className="px-4 py-2.5 text-center">TT</th>
                      <th className="px-4 py-2.5">Loại</th>
                      <th className="px-4 py-2.5">ĐK tiên quyết</th>
                      <th className="px-4 py-2.5">Học trước</th>
                      <th className="px-4 py-2.5 text-center">HK tổ chức</th>
                      <th className="px-4 py-2.5 text-center">Học kỳ</th>
                      <th className="px-4 py-2.5 text-center">Năm</th>
                      <th className="px-4 py-2.5 text-center w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {courses.map((c, idx) => {
                      const isEditing = editingIndex === idx;
                      const isSelected = selectedCodes.has(c.courseCode);

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-850/40 transition-colors ${
                            isSelected ? "text-slate-200" : "text-slate-500 bg-slate-950/20"
                          }`}
                        >
                          {/* Checkbox selection */}
                          <td className="px-4 py-2 text-center select-none">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(c.courseCode)}
                              className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {isEditing && editForm ? (
                            <>
                              {/* EDITING STATE ROW */}
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={editForm.courseCode}
                                  onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value.toUpperCase() })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1.5 py-1 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={editForm.courseName}
                                  onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1.5 py-1 text-xs text-white focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-14">
                                <input
                                  type="number"
                                  value={editForm.credits ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, credits: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-12">
                                <input
                                  type="number"
                                  value={editForm.theoryHours ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, theoryHours: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-12">
                                <input
                                  type="number"
                                  value={editForm.practiceHours ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, practiceHours: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-12">
                                <input
                                  type="number"
                                  value={editForm.projectHours ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, projectHours: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-12">
                                <input
                                  type="number"
                                  value={editForm.internshipHours ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, internshipHours: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <select
                                  value={editForm.courseType}
                                  onChange={(e) => setEditForm({ ...editForm, courseType: e.target.value })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-slate-300 focus:outline-none"
                                >
                                  <option value="REQUIRED">REQUIRED</option>
                                  <option value="ELECTIVE">ELECTIVE</option>
                                  <option value="PE">PE</option>
                                  <option value="ENGLISH">ENGLISH</option>
                                  <option value="DEFENSE">DEFENSE</option>
                                  <option value="OTHER">OTHER</option>
                                </select>
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={editForm.prerequisite ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, prerequisite: e.target.value || null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={editForm.corequisite ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, corequisite: e.target.value || null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-20">
                                <input
                                  type="text"
                                  value={editForm.organizingSemester ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, organizingSemester: e.target.value || null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-14">
                                <input
                                  type="number"
                                  value={editForm.expectedSemester ?? ""}
                                  onChange={(e) => setEditForm({ ...editForm, expectedSemester: e.target.value ? Number(e.target.value) : null })}
                                  className="w-full rounded border border-indigo-500 bg-slate-950 px-1 py-1 text-xs text-center focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1 w-12 text-center text-slate-400 font-semibold">
                                {editForm.expectedSemester ? Math.ceil(editForm.expectedSemester / 3) : "-"}
                              </td>
                              <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(idx)}
                                  className="p-1 rounded text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                                  title="Lưu"
                                >
                                  <Save size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="p-1 rounded text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                                  title="Hủy"
                                >
                                  <X size={13} />
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              {/* STANDARD READ STATE ROW */}
                              <td className={`px-4 py-2 font-bold font-mono ${isSelected ? "text-indigo-400" : "text-slate-600"}`}>
                                {c.courseCode}
                              </td>
                              <td className={`px-4 py-2 font-medium ${isSelected ? "text-slate-200" : "text-slate-600"}`}>
                                {c.courseName}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold">{c.credits ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-slate-400">{c.theoryHours ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-slate-400">{c.practiceHours ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-slate-400">{c.projectHours ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-slate-400">{c.internshipHours ?? "-"}</td>
                              <td className="px-4 py-2">
                                <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  !isSelected
                                    ? "bg-slate-850 text-slate-600"
                                    : c.courseType === "REQUIRED"
                                      ? "bg-indigo-500/10 text-indigo-400"
                                      : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {c.courseType}
                                </span>
                              </td>
                              <td className="px-4 py-2 truncate max-w-32 text-slate-400 text-[11px] font-mono" title={c.prerequisite || ""}>
                                {c.prerequisite || "-"}
                              </td>
                              <td className="px-4 py-2 truncate max-w-32 text-slate-400 text-[11px] font-mono" title={c.corequisite || ""}>
                                {c.corequisite || "-"}
                              </td>
                              <td className="px-4 py-2 text-center text-slate-400">
                                {c.organizingSemester || "-"}
                              </td>
                              <td className="px-4 py-2 text-center text-slate-400 font-semibold">
                                {c.expectedSemester ?? "-"}
                              </td>
                              <td className="px-4 py-2 text-center text-slate-400 font-semibold">
                                {c.expectedSemester ? Math.ceil(c.expectedSemester / 3) : "-"}
                              </td>
                              <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(idx, c)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition cursor-pointer"
                                  title="Chỉnh sửa môn học này"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(idx, c.courseCode)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-850 transition cursor-pointer"
                                  title="Xóa môn học này"
                                >
                                  <Trash2 size={12} />
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
        </>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          disabled={submitting || loadingSheet}
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <XCircle size={16} />
          Hủy & Xóa phiên
        </button>
        <button
          type="button"
          disabled={submitting || loadingSheet || selectedCodes.size === 0}
          onClick={handleConfirm}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          Xác nhận Nhập vào DB ({selectedCodes.size} môn)
        </button>
      </div>
    </div>
  );
};
