import { useState, useEffect } from "react";
import { useCurriculumImports } from "../../../hooks/useCurriculumImports";
import type { ImportItem } from "../../../hooks/useCurriculumImports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Plus } from "lucide-react";
import { CurriculumImportForm } from "./CurriculumImportForm";
import { CurriculumImportPreview } from "./CurriculumImportPreview";
import { getCurriculumImportsColumns } from "./CurriculumImportsColumns";
import { api } from "../../../services/api";
import { CurriculumImportsFilters } from "./partials/CurriculumImportsFilters";

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

export default function CurriculumImports() {
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
  } = useCurriculumImports();

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
    onConfirm: () => {},
  });

  const showNotification = (title: string, message: string, isDanger = false) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText: "Đóng",
      cancelText: null,
      isDanger,
      onConfirm: () => {},
    });
  };

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewData(null);
    setPreviewWarnings([]);
    setActiveSessionId(null);
    setSheetsList([]);
    setActiveSheetIndex(0);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const data = await startImport(formData);
      if (data) {
        setPreviewData(data.preview ?? []);
        setPreviewWarnings(data.warnings ?? []);
        setActiveSessionId(data.importSession?.id ?? null);
        setSheetsList(data.sheets ?? []);
        setActiveSheetIndex(data.activeSheetIndex ?? 0);
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
      const data = await changeSheet(activeSessionId, idx);
      if (data) {
        setPreviewData(data.preview ?? []);
        setPreviewWarnings(data.warnings ?? []);
        setSheetsList(data.sheets ?? []);
        setActiveSheetIndex(data.activeSheetIndex ?? 0);
      }
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
            onConfirm: () => {},
          });
        }
      },
    });
  };

  const columns = getCurriculumImportsColumns(handleConfirmImport, handleDelete);

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Nhập chương trình học</h1>
          <p className="mt-1 text-xs text-slate-400">
            Thu thập chi tiết đề cương môn học, đăng ký các môn điều kiện và lập bản đồ bảng tính chương trình học.
          </p>
        </div>
      </div>

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
          previewData
            ? "Xem trước cấu trúc Chương trình đào tạo học phần"
            : "Bắt đầu phiên nhập chương trình học mới"
        }
        size={previewData ? (isFullWidth ? "full" : "3xl") : "lg"}
      >
        {previewData ? (
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
        ) : (
          <CurriculumImportForm
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
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
