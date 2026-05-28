import React from "react";
import { Edit2, Trash2, Save, X } from "lucide-react";

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

interface CurriculumPreviewTableProps {
  courses: CoursePreviewItem[];
  selectedCodes: Set<string>;
  editingIndex: number | null;
  editForm: CoursePreviewItem | null;
  isFullWidth: boolean;
  onToggleAll: () => void;
  onToggleSelect: (code: string) => void;
  onStartEdit: (index: number, course: CoursePreviewItem) => void;
  onDeleteRow: (index: number, code: string) => void;
  onEditFormChange: (form: CoursePreviewItem) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
}

export const CurriculumPreviewTable: React.FC<CurriculumPreviewTableProps> = ({
  courses,
  selectedCodes,
  editingIndex,
  editForm,
  isFullWidth,
  onToggleAll,
  onToggleSelect,
  onStartEdit,
  onDeleteRow,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  return (
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
        <div className={`${isFullWidth ? "max-h-[58vh]" : "max-h-80"} overflow-y-auto transition-all`}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-855 bg-slate-900 sticky top-0 text-slate-400 font-semibold select-none z-10">
                <th className="px-4 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={courses.length > 0 && selectedCodes.size === courses.length}
                    onChange={onToggleAll}
                    className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-955 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
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
            <tbody className="divide-y divide-slate-855">
              {courses.map((c, idx) => {
                const isEditing = editingIndex === idx;
                const isSelected = selectedCodes.has(c.courseCode);

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-855/40 transition-colors ${
                      isSelected ? "text-slate-200" : "text-slate-505 bg-slate-955/20"
                    }`}
                  >
                    {/* Checkbox selection */}
                    <td className="px-4 py-2 text-center select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(c.courseCode)}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-955 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {isEditing && editForm ? (
                      <>
                        {/* EDITING STATE ROW */}
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={editForm.courseCode}
                            onChange={(e) => onEditFormChange({ ...editForm, courseCode: e.target.value.toUpperCase() })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={editForm.courseName}
                            onChange={(e) => onEditFormChange({ ...editForm, courseName: e.target.value })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-white focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-14">
                          <input
                            type="number"
                            value={editForm.credits ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, credits: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-12">
                          <input
                            type="number"
                            value={editForm.theoryHours ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, theoryHours: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-12">
                          <input
                            type="number"
                            value={editForm.practiceHours ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, practiceHours: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-12">
                          <input
                            type="number"
                            value={editForm.projectHours ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, projectHours: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-12">
                          <input
                            type="number"
                            value={editForm.internshipHours ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, internshipHours: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            value={editForm.courseType}
                            onChange={(e) => onEditFormChange({ ...editForm, courseType: e.target.value })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-slate-300 focus:outline-none"
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
                            onChange={(e) => onEditFormChange({ ...editForm, prerequisite: e.target.value || null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={editForm.corequisite ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, corequisite: e.target.value || null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-20">
                          <input
                            type="text"
                            value={editForm.organizingSemester ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, organizingSemester: e.target.value || null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-14">
                          <input
                            type="number"
                            value={editForm.expectedSemester ?? ""}
                            onChange={(e) => onEditFormChange({ ...editForm, expectedSemester: e.target.value ? Number(e.target.value) : null })}
                            className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
                          />
                        </td>
                        <td className="px-2 py-1 w-12 text-center text-slate-400 font-semibold">
                          {editForm.expectedSemester ? Math.ceil(editForm.expectedSemester / 3) : "-"}
                        </td>
                        <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onSaveEdit(idx)}
                            className="p-1 rounded text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                            title="Lưu"
                          >
                            <Save size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={onCancelEdit}
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
                            onClick={() => onStartEdit(idx, c)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition cursor-pointer"
                            title="Chỉnh sửa môn học này"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteRow(idx, c.courseCode)}
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
  );
};
