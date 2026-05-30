import React, { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "../../../services/api";
import { CurriculumSheetSelector } from "./CurriculumSheetSelector";
import { CurriculumWarningList } from "./CurriculumWarningList";
import { CurriculumPreviewTable } from "./CurriculumPreviewTable";
import { MergeStatusAlert } from "./partials/MergeStatusAlert";

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

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

const MERGEABLE_FIELDS = [
  "expectedSemester",
  "organizingSemester",
  "credits",
  "theoryHours",
  "practiceHours",
  "projectHours",
  "internshipHours",
  "courseGroup",
  "courseType",
  "prerequisite",
  "corequisite",
  "knowledgeBlock",
] as const;

type MergeableField = typeof MERGEABLE_FIELDS[number];

const FIELD_LABELS: Record<MergeableField, string> = {
  expectedSemester: "Học kỳ dự kiến",
  organizingSemester: "Học kỳ tổ chức",
  credits: "Số tín chỉ",
  theoryHours: "Giờ lý thuyết",
  practiceHours: "Giờ thực hành",
  projectHours: "Giờ đồ án",
  internshipHours: "Giờ thực tập",
  courseGroup: "Nhóm môn học",
  courseType: "Loại môn học",
  prerequisite: "Môn tiên quyết",
  corequisite: "Môn song hành",
  knowledgeBlock: "Khối kiến thức",
};

function isPopulated(field: string, val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed === "" ||
      trimmed.toLowerCase() === "null" ||
      trimmed.toLowerCase() === "undefined" ||
      trimmed === "-" ||
      trimmed === "0" ||
      trimmed.toLowerCase() === "n/a"
    ) {
      return false;
    }
    if (field === "courseType" && trimmed === "OTHER") return false;
  }
  if (typeof val === "number") {
    if (isNaN(val)) return false;
    if ((field === "expectedSemester" || field === "organizingSemester") && val <= 0) {
      return false;
    }
  }
  return true;
}

function getColumnCompleteness(coursesList: CoursePreviewItem[], field: MergeableField): number {
  if (coursesList.length === 0) return 0;
  let populatedCount = 0;
  for (const course of coursesList) {
    if (isPopulated(field, course[field])) {
      populatedCount++;
    }
  }
  return populatedCount / coursesList.length;
}

function getMergedValue<T>(field: MergeableField, valY: T, valX: T, prioSource: boolean): T {
  const hasY = isPopulated(field, valY);
  const hasX = isPopulated(field, valX);
  if (prioSource) {
    return hasX ? valX : valY;
  } else {
    return hasY ? valY : valX;
  }
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
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(
    new Set(initialCourses.map((c) => c.courseCode + "_" + c.courseType))
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CoursePreviewItem | null>(null);
  const [knowledgeBlocks, setKnowledgeBlocks] = useState<Array<{ knowledge_block: string; label: string }>>([]);

  React.useEffect(() => {
    api.get("/knowledge_block_mappings")
      .then((res) => {
        setKnowledgeBlocks(res.data || []);
      })
      .catch((err) => console.error("Failed to fetch knowledge blocks:", err));
  }, []);

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

      // 1. Identify which fields are more complete in sourceCourses (Sheet 2) than in courses (Sheet 1)
      const prioritizeSourceFields: Record<string, boolean> = {};
      const prioritizedFieldLabels: string[] = [];

      MERGEABLE_FIELDS.forEach((field) => {
        const compY = getColumnCompleteness(courses, field);
        const compX = getColumnCompleteness(sourceCourses, field);
        if (compX > compY) {
          prioritizeSourceFields[field] = true;
          prioritizedFieldLabels.push(FIELD_LABELS[field]);
        } else {
          prioritizeSourceFields[field] = false;
        }
      });

      const nextCourses = courses.map((courseY) => {
        const matchingCourseX = sourceCourses.find(
          (courseX) =>
            courseX.courseCode.trim().toUpperCase() ===
            courseY.courseCode.trim().toUpperCase() &&
            courseX.courseType === courseY.courseType
        ) || sourceCourses.find(
          (courseX) =>
            courseX.courseCode.trim().toUpperCase() ===
            courseY.courseCode.trim().toUpperCase()
        );

        if (matchingCourseX) {
          mergeCount++;
          return {
            ...courseY,
            expectedSemester: getMergedValue("expectedSemester", courseY.expectedSemester, matchingCourseX.expectedSemester, !!prioritizeSourceFields.expectedSemester),
            organizingSemester: getMergedValue("organizingSemester", courseY.organizingSemester, matchingCourseX.organizingSemester, !!prioritizeSourceFields.organizingSemester),
            credits: getMergedValue("credits", courseY.credits, matchingCourseX.credits, !!prioritizeSourceFields.credits),
            theoryHours: getMergedValue("theoryHours", courseY.theoryHours, matchingCourseX.theoryHours, !!prioritizeSourceFields.theoryHours),
            practiceHours: getMergedValue("practiceHours", courseY.practiceHours, matchingCourseX.practiceHours, !!prioritizeSourceFields.practiceHours),
            projectHours: getMergedValue("projectHours", courseY.projectHours, matchingCourseX.projectHours, !!prioritizeSourceFields.projectHours),
            internshipHours: getMergedValue("internshipHours", courseY.internshipHours, matchingCourseX.internshipHours, !!prioritizeSourceFields.internshipHours),
            courseGroup: getMergedValue("courseGroup", courseY.courseGroup, matchingCourseX.courseGroup, !!prioritizeSourceFields.courseGroup),
            courseType: getMergedValue("courseType", courseY.courseType, matchingCourseX.courseType, !!prioritizeSourceFields.courseType),
            prerequisite: getMergedValue("prerequisite", courseY.prerequisite, matchingCourseX.prerequisite, !!prioritizeSourceFields.prerequisite),
            corequisite: getMergedValue("corequisite", courseY.corequisite, matchingCourseX.corequisite, !!prioritizeSourceFields.corequisite),
            knowledgeBlock: getMergedValue("knowledgeBlock", courseY.knowledgeBlock, matchingCourseX.knowledgeBlock, !!prioritizeSourceFields.knowledgeBlock),
          };
        }
        return courseY;
      });

      setCourses(nextCourses);

      const nextSelected = new Set(selectedCodes);
      nextCourses.forEach((c) => nextSelected.add(c.courseCode + "_" + c.courseType));
      setSelectedCodes(nextSelected);

      const prioritizedMsg = prioritizedFieldLabels.length > 0
        ? `. Do Sheet 1 thiếu/không đầy đủ, hệ thống ưu tiên lấy từ "${sheets[sourceIdx]}" các cột: ${prioritizedFieldLabels.join(", ")}`
        : "";

      setMergeStatus(
        `Đã trộn thành công! Đối khớp được ${mergeCount}/${courses.length} môn học từ sheet "${sheets[sourceIdx]}"${prioritizedMsg}.`
      );

      setTimeout(() => {
        setMergeStatus(null);
      }, 7500);
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

  const handlePerformMergeAll = async () => {
    setShowMergeDropdown(false);
    setMergingSheet(true);
    setMergeStatus(`Đang chuẩn bị trộn dữ liệu từ tất cả các sheet còn lại...`);

    const otherIndices = sheets
      .map((_, idx) => idx)
      .filter((idx) => idx !== activeSheetIndex);

    let currentCourses = [...courses];
    let totalMerged = 0;
    const allPrioritizedFields = new Set<string>();

    try {
      for (const sourceIdx of otherIndices) {
        setMergeStatus(`Đang trộn dữ liệu từ sheet "${sheets[sourceIdx]}"...`);

        const response = await api.post(`/curriculum_imports/${activeSessionId}/reparse`, {
          sheetIndex: sourceIdx,
        });

        if (response.data?.preview && Array.isArray(response.data.preview)) {
          const sourceCourses: CoursePreviewItem[] = response.data.preview;
          let sheetMergeCount = 0;

          // Compute prioritization for this source sheet against the current accumulated courses
          const prioritizeSourceFields: Record<string, boolean> = {};
          MERGEABLE_FIELDS.forEach((field) => {
            const compY = getColumnCompleteness(currentCourses, field);
            const compX = getColumnCompleteness(sourceCourses, field);
            if (compX > compY) {
              prioritizeSourceFields[field] = true;
              allPrioritizedFields.add(FIELD_LABELS[field]);
            } else {
              prioritizeSourceFields[field] = false;
            }
          });

          currentCourses = currentCourses.map((courseY) => {
            const matchingCourseX = sourceCourses.find(
              (courseX) =>
                courseX.courseCode.trim().toUpperCase() ===
                courseY.courseCode.trim().toUpperCase() &&
                courseX.courseType === courseY.courseType
            ) || sourceCourses.find(
              (courseX) =>
                courseX.courseCode.trim().toUpperCase() ===
                courseY.courseCode.trim().toUpperCase()
            );

            if (matchingCourseX) {
              sheetMergeCount++;
              return {
                ...courseY,
                expectedSemester: getMergedValue("expectedSemester", courseY.expectedSemester, matchingCourseX.expectedSemester, !!prioritizeSourceFields.expectedSemester),
                organizingSemester: getMergedValue("organizingSemester", courseY.organizingSemester, matchingCourseX.organizingSemester, !!prioritizeSourceFields.organizingSemester),
                credits: getMergedValue("credits", courseY.credits, matchingCourseX.credits, !!prioritizeSourceFields.credits),
                theoryHours: getMergedValue("theoryHours", courseY.theoryHours, matchingCourseX.theoryHours, !!prioritizeSourceFields.theoryHours),
                practiceHours: getMergedValue("practiceHours", courseY.practiceHours, matchingCourseX.practiceHours, !!prioritizeSourceFields.practiceHours),
                projectHours: getMergedValue("projectHours", courseY.projectHours, matchingCourseX.projectHours, !!prioritizeSourceFields.projectHours),
                internshipHours: getMergedValue("internshipHours", courseY.internshipHours, matchingCourseX.internshipHours, !!prioritizeSourceFields.internshipHours),
                courseGroup: getMergedValue("courseGroup", courseY.courseGroup, matchingCourseX.courseGroup, !!prioritizeSourceFields.courseGroup),
                courseType: getMergedValue("courseType", courseY.courseType, matchingCourseX.courseType, !!prioritizeSourceFields.courseType),
                prerequisite: getMergedValue("prerequisite", courseY.prerequisite, matchingCourseX.prerequisite, !!prioritizeSourceFields.prerequisite),
                corequisite: getMergedValue("corequisite", courseY.corequisite, matchingCourseX.corequisite, !!prioritizeSourceFields.corequisite),
                knowledgeBlock: getMergedValue("knowledgeBlock", courseY.knowledgeBlock, matchingCourseX.knowledgeBlock, !!prioritizeSourceFields.knowledgeBlock),
              };
            }
            return courseY;
          });

          totalMerged += sheetMergeCount;
        }
      }

      setCourses(currentCourses);

      const nextSelected = new Set(selectedCodes);
      currentCourses.forEach((c) => nextSelected.add(c.courseCode + "_" + c.courseType));
      setSelectedCodes(nextSelected);

      const prioritizedList = Array.from(allPrioritizedFields);
      const prioritizedMsg = prioritizedList.length > 0
        ? `. Ưu tiên lấy từ các sheet khác các cột: ${prioritizedList.join(", ")}`
        : "";

      setMergeStatus(
        `Đã trộn thành công từ tất cả các sheet! Khớp được ${totalMerged} lượt thông tin môn học${prioritizedMsg}.`
      );

      setTimeout(() => {
        setMergeStatus(null);
      }, 7500);
    } catch (err) {
      console.error("Failed to merge all sheets:", err);
      setMergeStatus("Lỗi: Không thể hoàn tất trộn hàng loạt từ tất cả các sheet.");
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
      const selectedList = courses.filter((c) => selectedCodes.has(c.courseCode + "_" + c.courseType));
      await onConfirm(selectedList);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSelect = (compositeKey: string) => {
    const next = new Set(selectedCodes);
    if (next.has(compositeKey)) {
      next.delete(compositeKey);
    } else {
      next.add(compositeKey);
    }
    setSelectedCodes(next);
  };

  const handleToggleAll = () => {
    if (selectedCodes.size === courses.length) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(courses.map((c) => c.courseCode + "_" + c.courseType)));
    }
  };

  const handleDeleteRow = (index: number, compositeKey: string) => {
    const nextCourses = [...courses];
    nextCourses.splice(index, 1);
    setCourses(nextCourses);

    const nextSelected = new Set(selectedCodes);
    nextSelected.delete(compositeKey);
    setSelectedCodes(nextSelected);
  };

  const handleStartEdit = (index: number, course: CoursePreviewItem) => {
    setEditingIndex(index);
    setEditForm({ ...course });
  };

  const handleSaveEdit = (index: number) => {
    if (!editForm) return;
    const nextCourses = [...courses];
    const oldItem = nextCourses[index];
    const oldKey = oldItem.courseCode + "_" + oldItem.courseType;
    nextCourses[index] = { ...editForm };
    setCourses(nextCourses);

    const nextSelected = new Set(selectedCodes);
    if (nextSelected.has(oldKey)) {
      nextSelected.delete(oldKey);
      nextSelected.add(editForm.courseCode + "_" + editForm.courseType);
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
        onPerformMergeAll={handlePerformMergeAll}
      />

      {/* Loading Overlay */}
      {loadingSheet || mergingSheet ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          {mergingSheet ? "Đang liên kết (Join) các trường dữ liệu..." : `Đang phân tích cú pháp Sheet "${sheets[activeSheetIndex] || "Excel"}"...`}
        </div>
      ) : (
        <>
          {/* Merge Status Toast Alert component */}
          <MergeStatusAlert mergeStatus={mergeStatus} />

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
            knowledgeBlocks={knowledgeBlocks}
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
