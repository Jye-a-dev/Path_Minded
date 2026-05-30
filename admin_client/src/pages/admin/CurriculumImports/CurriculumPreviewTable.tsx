import React from "react";
import { PreviewTableRowEdit } from "./partials/PreviewTableRowEdit";
import { PreviewTableRowRead } from "./partials/PreviewTableRowRead";

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
  knowledgeBlock?: string | null;
}

interface CurriculumPreviewTableProps {
  courses: CoursePreviewItem[];
  selectedCodes: Set<string>;
  editingIndex: number | null;
  editForm: CoursePreviewItem | null;
  isFullWidth: boolean;
  onToggleAll: () => void;
  onToggleSelect: (compositeKey: string) => void;
  onStartEdit: (index: number, course: CoursePreviewItem) => void;
  onDeleteRow: (index: number, compositeKey: string) => void;
  onEditFormChange: (form: CoursePreviewItem) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  knowledgeBlocks: Array<{ knowledge_block: string; label: string }>;
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
  knowledgeBlocks,
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
                <th className="px-4 py-2.5">Khối kiến thức</th>
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
                const compositeKey = c.courseCode + "_" + c.courseType;
                const isSelected = selectedCodes.has(compositeKey);

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
                        onChange={() => onToggleSelect(compositeKey)}
                        className="h-3.5 w-3.5 rounded border-slate-800 bg-slate-955 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {isEditing && editForm ? (
                      <PreviewTableRowEdit
                        idx={idx}
                        editForm={editForm}
                        onEditFormChange={onEditFormChange}
                        onSaveEdit={onSaveEdit}
                        onCancelEdit={onCancelEdit}
                        knowledgeBlocks={knowledgeBlocks}
                      />
                    ) : (
                      <PreviewTableRowRead
                        idx={idx}
                        c={c}
                        compositeKey={compositeKey}
                        isSelected={isSelected}
                        onStartEdit={onStartEdit}
                        onDeleteRow={onDeleteRow}
                        knowledgeBlocks={knowledgeBlocks}
                      />
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
