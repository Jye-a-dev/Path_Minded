import { useState, useEffect } from "react";
import { useCurriculumImports } from "../../../hooks/useCurriculumImports";
import type { ImportItem } from "../../../hooks/useCurriculumImports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Plus, ArrowLeft } from "lucide-react";
import { CurriculumImportForm } from "./CurriculumImportForm";
import { CurriculumImportPreview } from "./CurriculumImportPreview";
import { getCurriculumImportsColumns } from "./CurriculumImportsColumns";
import { api } from "../../../services/api";
import { CurriculumImportsFilters } from "./partials/CurriculumImportsFilters";
import { RealtimeStreamConsole } from "./RealtimeStreamConsole";
import { DynamicSchemaResolver } from "./DynamicSchemaResolver";
import { ConflictResolutionCenter } from "./ConflictResolutionCenter";
import type { ConflictItem } from "./ConflictResolutionCenter";

export interface CoursePreviewItem {
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

export interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface CurriculumImportsManagerProps {
  selectedMajor: string;
  onBack: () => void;
  hideHeader?: boolean;
}

export function CurriculumImportsManager({
  selectedMajor,
  onBack,
  hideHeader = false,
}: CurriculumImportsManagerProps) {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    setPage,
    setLimit,
    setSearch,
    filters,
    updateFilters,
    clearFilters,
    deleteItem,
    startImport,
    confirmImport,
    cancelImport,
    changeSheet,
  } = useCurriculumImports(
    selectedMajor && selectedMajor !== "TẤT CẢ" ? { major_name: selectedMajor } : {}
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [programsList, setProgramsList] = useState<{ id: string; program_code: string; program_name: string; major_name?: string }[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get("/programs?limit=100");
        setProgramsList(response.data || []);
      } catch (err) {
        console.error("Failed to fetch programs list:", err);
      }
    };
    void fetchPrograms();
  }, []);

  const [isFullWidth, setIsFullWidth] = useState(true);

  const [importPhase, setImportPhase] = useState<"form" | "streaming" | "mapping" | "conflict_resolution" | "preview">("form");
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  const [previewData, setPreviewData] = useState<CoursePreviewItem[] | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string | null;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const showNotification = (title: string, message: string, isDanger = false) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText: "Đóng",
      cancelText: null,
      isDanger,
      onConfirm: () => { },
    });
  };

  const handleOpenCreate = () => {
    setModalOpen(true);
    setImportPhase("form");
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewData(null);
    setPreviewWarnings([]);
    setActiveSessionId(null);
    setSheetsList([]);
    setActiveSheetIndex(0);
    setImportPhase("form");
    setRawHeaders([]);
    setConflicts([]);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const data = await startImport(formData);
      if (data && data.importSession) {
        setActiveSessionId(data.importSession.id);
        setImportPhase("streaming");
      }
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Tải lên tệp thất bại.", true);
    }
  };

  const handleConfirmPreview = async (selectedCourses: CoursePreviewItem[]) => {
    if (!activeSessionId) return;
    try {
      await confirmImport(activeSessionId, selectedCourses);
      showNotification("Thành công", "Xác nhận phiên nhập chương trình học và lưu vào DB thành công!");
      handleCloseModal();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Xác nhận phiên nhập thất bại.", true);
    }
  };

  const handleCancelPreview = async () => {
    if (activeSessionId) {
      try {
        await cancelImport(activeSessionId);
      } catch (e) {
        console.error("Failed to delete draft session:", e);
      }
    }
    handleCloseModal();
  };

  const handleSheetChange = async (idx: number) => {
    if (!activeSessionId) return;
    try {
      await changeSheet(activeSessionId, idx);
      setImportPhase("streaming");
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Chuyển đổi trang tính thất bại.", true);
    }
  };

  const handleConfirmImport = () => {
    showNotification(
      "Thông báo",
      "Phiên nhập này chưa được xác nhận hoàn tất. Vui lòng bấm '+ Phiên nhập mới' để tải lên lại và nhấn 'Xác nhận Nhập vào DB' ở bảng xem trước."
    );
  };

  const handleDelete = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa phiên nhập",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa phiên nhập",
      cancelText: "Hủy bỏ",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteItem(id);
        } catch (err) {
          setConfirmState({
            isOpen: true,
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Xóa phiên nhập thất bại",
            confirmText: "Đóng",
            cancelText: null,
            isDanger: true,
            onConfirm: () => { },
          });
        }
      },
    });
  };

  const columns = getCurriculumImportsColumns(handleConfirmImport, handleDelete);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Nhập chương trình học</h1>
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft size={12} />
                Đổi ngành học
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Đang quản lý ngành học: <strong className="text-indigo-400 font-bold">{selectedMajor || "N/A"}</strong>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ImportItem>
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm phiên nhập bảng tính..."
        filters={
          <CurriculumImportsFilters
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            programsList={programsList}
          />
        }
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Phiên nhập mới
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={
          importPhase === "preview"
            ? "Xem trước cấu trúc Chương trình đào tạo học phần"
            : importPhase === "streaming"
              ? "Đang phân tích dữ liệu & đối soát..."
              : importPhase === "mapping"
                ? "Ánh xạ Lược đồ cột Excel (Schema Resolver)"
                : importPhase === "conflict_resolution"
                  ? "Giải quyết Xung đột Dữ liệu (Conflict Resolution)"
                  : "Bắt đầu phiên nhập chương trình học mới"
        }
        size={
          importPhase === "preview"
            ? (isFullWidth ? "full" : "3xl")
            : importPhase === "conflict_resolution" || importPhase === "mapping"
              ? "2xl"
              : "lg"
        }
      >
        {importPhase === "preview" && previewData ? (
          <CurriculumImportPreview
            key={`${activeSessionId}-${activeSheetIndex}`}
            activeSessionId={activeSessionId!}
            courses={previewData}
            warnings={previewWarnings}
            sheets={sheetsList}
            activeSheetIndex={activeSheetIndex}
            onConfirm={handleConfirmPreview}
            onCancel={handleCancelPreview}
            onSheetChange={handleSheetChange}
            isFullWidth={isFullWidth}
            onToggleFullWidth={() => setIsFullWidth(!isFullWidth)}
          />
        ) : importPhase === "streaming" && activeSessionId ? (
          <RealtimeStreamConsole
            importSessionId={activeSessionId}
            onUnresolvedHeaders={(data) => {
              setRawHeaders(data.rawHeaders);
              setSheetsList(data.sheets);
              setActiveSheetIndex(data.activeSheetIndex);
              setImportPhase("mapping");
            }}
            onComplete={(data) => {
              setPreviewData(data.preview);
              setPreviewWarnings(data.warnings);
              setSheetsList(data.sheets);
              setActiveSheetIndex(data.activeSheetIndex);
              setConflicts(data.conflicts);
              if (data.conflicts && data.conflicts.length > 0) {
                setImportPhase("conflict_resolution");
              } else {
                setImportPhase("preview");
              }
            }}
            onCancel={handleCancelPreview}
          />
        ) : importPhase === "mapping" && activeSessionId ? (
          <DynamicSchemaResolver
            importSessionId={activeSessionId}
            rawHeaders={rawHeaders}
            sheets={sheetsList}
            activeSheetIndex={activeSheetIndex}
            onSuccess={async () => {
              try {
                await changeSheet(activeSessionId, 0);
                setImportPhase("streaming");
              } catch (e) {
                console.error("Failed to reparse", e);
                showNotification("Lỗi", "Không thể chạy lại luồng phân tích.", true);
              }
            }}
            onCancel={handleCancelPreview}
          />
        ) : importPhase === "conflict_resolution" && activeSessionId ? (
          <ConflictResolutionCenter
            conflicts={conflicts}
            onCancel={handleCancelPreview}
            onResolve={(resolutions, customEdits = {}) => {
              const updatedCourses: CoursePreviewItem[] = [];

              for (const course of (previewData || [])) {
                const code = course.courseCode || ((course as unknown as Record<string, unknown>).course_code as string);
                const resolution = resolutions[code];
                const conflict = conflicts.find((c) => c.courseCode === code);

                if (!resolution || !conflict) {
                  updatedCourses.push(course);
                  continue;
                }

                if (resolution === "db") {
                  // Giữ nguyên dữ liệu CSDL
                  updatedCourses.push({
                    ...course,
                    courseName: conflict.dbRecord.course_name,
                    credits: conflict.dbRecord.credits,
                    theoryHours: conflict.dbRecord.theory_hours,
                    practiceHours: conflict.dbRecord.practice_hours,
                    knowledgeBlock: conflict.dbRecord.knowledge_block,
                  });
                } else if (resolution === "custom" && customEdits[code]) {
                  const edit = customEdits[code];
                  const newCourseCode = edit.courseCode || code;

                  if (newCourseCode !== code) {
                    // Versioning: Giữ lại bản ghi cũ (giữ nguyên), thêm môn học mới với mã đã đổi
                    updatedCourses.push(course); // Môn cũ giữ nguyên
                    updatedCourses.push({
                      ...course,
                      courseCode: newCourseCode,
                      courseName: edit.courseName ?? course.courseName,
                      credits: edit.credits ?? course.credits,
                      theoryHours: edit.theoryHours ?? course.theoryHours,
                      practiceHours: edit.practiceHours ?? course.practiceHours,
                      knowledgeBlock: edit.knowledgeBlock ?? course.knowledgeBlock,
                    });
                  } else {
                    // Tùy biến thuần túy (không đổi mã môn)
                    updatedCourses.push({
                      ...course,
                      ...edit,
                      courseCode: newCourseCode,
                    });
                  }
                } else {
                  // Ghi đè bằng dữ liệu Excel mới (mặc định)
                  updatedCourses.push(course);
                }
              }
              setPreviewData(updatedCourses);
              setImportPhase("preview");
            }}
          />
        ) : (
          <CurriculumImportForm
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            defaultMajor={selectedMajor === "TẤT CẢ" ? undefined : selectedMajor}
          />
        )}
      </Modal>

      {/* Custom Confirm Dialog Webform Component */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDanger={confirmState.isDanger}
        onConfirm={confirmState.onConfirm}
      />
    </div>
  );
}
