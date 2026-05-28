import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "../../../services/api";
import { CurriculumSheetSelector } from "./CurriculumSheetSelector";
import { CurriculumWarningList } from "./CurriculumWarningList";
import { CurriculumPreviewTable } from "./CurriculumPreviewTable";

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
  activeSessionId: string;
  courses: CoursePreviewItem[];
  warnings: WarningItem[];
  sheets: string[];
  activeSheetIndex: number;
  onConfirm: (selectedCourses: CoursePreviewItem[]) => Promise<void>;
  onCancel: () => Promise<void>;
  onSheetChange: (index: number) => Promise<void>;
  isFullWidth?: boolean;
  onToggleFullWidth?: () => void;
}

export const CurriculumImportPreview: React.FC<CurriculumImportPreviewProps> = ({
  activeSessionId,
  courses: initialCourses,
  warnings,
  sheets,
  activeSheetIndex,
  onConfirm,
  onCancel,
  onSheetChange,
  isFullWidth = true,
  onToggleFullWidth,
}) => {
  const [courses, setCourses] = useState<CoursePreviewItem[]>(initialCourses);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set(initialCourses.map((c) => c.courseCode)));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CoursePreviewItem | null>(null);

  const [loadingSheet, setLoadingSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showMergeDropdown, setShowMergeDropdown] = useState(false);
  const [mergingSheet, setMergingSheet] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<string | null>(null);

  const handlePerformMerge = async (sourceIdx: number) => {
    setShowMergeDropdown(false);
    setMergingSheet(true);
    setMergeStatus(`Đang lấy dữ liệu từ sheet "${sheets[sourceIdx]}"...`);

    try {
      const response = await api.post(`/curriculum_imports/${activeSessionId}/reparse`, {
        sheetIndex: sourceIdx,
      });

      if (!response.data?.preview || !Array.isArray(response.data.preview)) {
        throw new Error("Dữ liệu nguồn không hợp lệ.");
      }

      const sourceCourses: CoursePreviewItem[] = response.data.preview;
      let mergeCount = 0;

      const nextCourses = courses.map((courseY) => {
        const matchingCourseX = sourceCourses.find(
          (courseX) =>
            courseX.courseCode.trim().toUpperCase() ===
            courseY.courseCode.trim().toUpperCase()
        );

        if (matchingCourseX) {
          mergeCount++;
          return {
            ...courseY,
            expectedSemester: courseY.expectedSemester || matchingCourseX.expectedSemester,
            organizingSemester: courseY.organizingSemester || matchingCourseX.organizingSemester,
            credits: courseY.credits ?? matchingCourseX.credits,
            theoryHours: courseY.theoryHours ?? matchingCourseX.theoryHours,
            practiceHours: courseY.practiceHours ?? matchingCourseX.practiceHours,
            projectHours: courseY.projectHours ?? matchingCourseX.projectHours,
            internshipHours: courseY.internshipHours ?? matchingCourseX.internshipHours,
            courseGroup: courseY.courseGroup ?? matchingCourseX.courseGroup,
            courseType: courseY.courseType && courseY.courseType !== "OTHER" ? courseY.courseType : matchingCourseX.courseType,
            prerequisite: courseY.prerequisite ?? matchingCourseX.prerequisite,
            corequisite: courseY.corequisite ?? matchingCourseX.corequisite,
          };
        }
        return courseY;
      });

      setCourses(nextCourses);

      const nextSelected = new Set(selectedCodes);
      nextCourses.forEach((c) => nextSelected.add(c.courseCode));
      setSelectedCodes(nextSelected);

      setMergeStatus(
        `Đã trộn thành công! Đối khớp được ${mergeCount}/${courses.length} môn học từ sheet "${sheets[sourceIdx]}".`
      );

      setTimeout(() => {
        setMergeStatus(null);
      }, 6050);
    } catch (err) {
      console.error("Failed to merge sheets:", err);
      setMergeStatus("Lỗi: Không thể lấy dữ liệu từ trang tính đã chọn.");
      setTimeout(() => {
        setMergeStatus(null);
      }, 5000);
    } finally {
      setMergingSheet(false);
    }
  };

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

  const handleDeleteRow = (index: number, code: string) => {
    const nextCourses = [...courses];
    nextCourses.splice(index, 1);
    setCourses(nextCourses);

    const nextSelected = new Set(selectedCodes);
    nextSelected.delete(code);
    setSelectedCodes(nextSelected);
  };

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

  return (
    <div className="space-y-6">
      {/* Sheets / Tables Tabs Component */}
      <CurriculumSheetSelector
        sheets={sheets}
        activeSheetIndex={activeSheetIndex}
        loadingSheet={loadingSheet}
        mergingSheet={mergingSheet}
        onSheetSelect={handleSheetSelect}
        isFullWidth={isFullWidth}
        onToggleFullWidth={onToggleFullWidth}
        showMergeDropdown={showMergeDropdown}
        onToggleMergeDropdown={setShowMergeDropdown}
        onPerformMerge={handlePerformMerge}
      />

      {/* Loading Overlay */}
      {loadingSheet || mergingSheet ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          {mergingSheet ? "Đang liên kết (Join) các trường dữ liệu..." : `Đang phân tích cú pháp Sheet "${sheets[activeSheetIndex] || "Excel"}"...`}
        </div>
      ) : (
        <>
          {/* Merge Status Toast Alert */}
          {mergeStatus && (
            <div className={`rounded-lg p-4 text-xs font-semibold border flex items-center gap-2 ${
              mergeStatus.startsWith("Lỗi")
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : mergeStatus.startsWith("Đang")
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}>
              {mergeStatus.startsWith("Đang") ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>{mergeStatus}</span>
            </div>
          )}

          {/* Alert Summary */}
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-slate-200 text-sm font-semibold block">Dữ liệu phân tích thành công</span>
              <span className="text-xs text-slate-400 mt-0.5 block">
                Sheet đang hiển thị: <strong className="text-white">"{sheets[activeSheetIndex] || "Sheet1"}"</strong>.
                Đã chọn <strong className="text-indigo-400">{selectedCodes.size}/{courses.length}</strong> môn học.
              </span>
            </div>
          </div>

          {/* Warnings List Component */}
          <CurriculumWarningList
            warnings={warnings}
            selectedCodes={selectedCodes}
          />

          {/* Preview Table Component */}
          <CurriculumPreviewTable
            courses={courses}
            selectedCodes={selectedCodes}
            editingIndex={editingIndex}
            editForm={editForm}
            isFullWidth={isFullWidth}
            onToggleAll={handleToggleAll}
            onToggleSelect={handleToggleSelect}
            onStartEdit={handleStartEdit}
            onDeleteRow={handleDeleteRow}
            onEditFormChange={setEditForm}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
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
