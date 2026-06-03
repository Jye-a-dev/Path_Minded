import { useState } from "react";
import { useClassImports } from "../../../../hooks/useClassImports";
import type { ClassImportItem as ImportItem } from "../../../../hooks/useClassImports";
import { DataTable } from "../../../../components/data_display/DataTable";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { Plus, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { ClassImportForm } from "../ClassImportForm";
import { ClassImportPreview } from "../ClassImportPreview";
import type { ParsedStudentItem } from "../ClassImportPreview";
import { ClassImportsFilters } from "./ClassImportsFilters";

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface ClassItem {
  id: string;
  class_code: string;
  class_name?: string;
  program_id?: string;
}

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface ImportsTabProps {
  selectedMajor: string;
  classesForMajor: ClassItem[];
  allPrograms: ProgramItem[];
}

export function ImportsTab({ selectedMajor, classesForMajor, allPrograms }: ImportsTabProps) {
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
    deleteItem: deleteImport,
    createImport,
    confirmImport,
  } = useClassImports();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ParsedStudentItem[] | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isFullWidth, setIsFullWidth] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string | null;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => {} });

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

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewData(null);
    setPreviewWarnings([]);
    setActiveSessionId(null);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await createImport(formData);
      if (result) {
        setPreviewData(result.preview ?? []);
        setPreviewWarnings(result.warnings ?? []);
        setActiveSessionId(result.importSession?.id ?? null);
      }
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", e.response?.data?.message || e.message || "Tải lên tệp thất bại.", true);
    }
  };

  const handleConfirmPreview = async (selected: ParsedStudentItem[]) => {
    if (!activeSessionId) return;
    try {
      const mapped = selected.map((s) => ({
        student_code: s.studentCode,
        full_name: s.fullName,
        email: s.email,
      }));
      await confirmImport(activeSessionId, mapped);
      showNotification("Thành công", "Xác nhận danh sách sinh viên lớp học và lưu vào DB thành công!");
      handleCloseModal();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", e.response?.data?.message || e.message || "Xác nhận phiên nhập thất bại.", true);
    }
  };

  const handleCancelPreview = async () => {
    if (activeSessionId) {
      try { await deleteImport(activeSessionId); }
      catch (e) { console.error("Failed to delete draft session:", e); }
    }
    handleCloseModal();
  };

  const handleConfirmImport = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận nhập dữ liệu",
      message: "Bạn có chắc chắn muốn xác nhận nhập danh sách sinh viên của phiên này vào cơ sở dữ liệu?",
      confirmText: "Xác nhận Nhập",
      cancelText: "Hủy bỏ",
      isDanger: false,
      onConfirm: async () => {
        setConfirmingId(id);
        try {
          await confirmImport(id);
          showNotification("Thành công", "Nhập danh sách sinh viên lớp học đã được xác nhận và xử lý thành công!");
        } catch (err) {
          const e = err as { response?: { data?: { message?: string } }; message?: string };
          showNotification("Lỗi", e.response?.data?.message || e.message || "Xác nhận nhập dữ liệu thất bại.", true);
        } finally {
          setConfirmingId(null);
        }
      },
    });
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa phiên nhập",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập lớp học này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa phiên nhập",
      cancelText: "Hủy bỏ",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteImport(id);
          showNotification("Thành công", "Xóa phiên nhập lớp học thành công!");
        } catch (err) {
          showNotification("Lỗi", err instanceof Error ? err.message : "Xóa phiên thất bại", true);
        }
      },
    });
  };

  const columns = [
    {
      header: "Chi tiết phiên",
      render: (row: ImportItem) => (
        <div>
          <span className="text-slate-200 font-bold block">{row.file_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "import_status",
      render: (row: ImportItem) => {
        const badges = {
          PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = { PENDING: "CHỜ XỬ LÝ", SUCCESS: "THÀNH CÔNG", FAILED: "THẤT BẠI" };
        return (
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.import_status]}`}>
            {statusMap[row.import_status]}
          </span>
        );
      },
    },
    {
      header: "Thời gian Tải lên / Xử lý",
      render: (row: ImportItem) => (
        <div className="text-xs text-slate-400 font-mono">
          <div>Tải lên: {new Date(row.uploaded_at).toLocaleString()}</div>
          {row.processed_at && (
            <div className="text-emerald-500">Xử lý: {new Date(row.processed_at).toLocaleString()}</div>
          )}
        </div>
      ),
    },
    {
      header: "Nhật ký lỗi",
      accessorKey: "import_error",
      render: (row: ImportItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block" title={row.import_error}>
          {row.import_error || "Không có"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: ImportItem) => (
        <div className="flex items-center gap-2">
          {row.import_status === "PENDING" && (
            <button
              onClick={() => handleConfirmImport(row.id)}
              disabled={confirmingId !== null}
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition cursor-pointer"
            >
              {confirmingId === row.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 size={12} />}
              Xác nhận
            </button>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">{error}</div>
      )}

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
        searchPlaceholder="Tìm kiếm phiên nhập lớp..."
        filters={
          <ClassImportsFilters
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            classesList={classesForMajor}
          />
        }
        rightActions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Phiên nhập mới
          </button>
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={previewData ? handleCancelPreview : handleCloseModal}
        title={previewData ? "Xem trước danh sách sinh viên lớp học" : "Bắt đầu phiên nhập sinh viên lớp học"}
        size={previewData ? (isFullWidth ? "full" : "3xl") : "lg"}
      >
        {previewData ? (
          <ClassImportPreview
            key={activeSessionId}
            students={previewData}
            warnings={previewWarnings}
            onConfirm={handleConfirmPreview}
            onCancel={handleCancelPreview}
            isFullWidth={isFullWidth}
            onToggleFullWidth={() => setIsFullWidth(!isFullWidth)}
          />
        ) : (
          <ClassImportForm
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            defaultMajor={selectedMajor}
            allPrograms={allPrograms}
          />
        )}
      </Modal>

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
