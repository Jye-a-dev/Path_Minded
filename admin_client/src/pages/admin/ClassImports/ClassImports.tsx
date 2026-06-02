import { useState, useEffect } from "react";
import { useClassImports } from "../../../hooks/useClassImports";
import type { ClassImportItem as ImportItem } from "../../../hooks/useClassImports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Plus, CheckCircle2, Trash2, Loader2, FolderInput, ChevronLeft } from "lucide-react";
import { ClassImportForm } from "./ClassImportForm";
import { ClassImportPreview } from "./ClassImportPreview";
import type { ParsedStudentItem } from "./ClassImportPreview";
import { api } from "../../../services/api";
import { ClassImportsFilters } from "./partials/ClassImportsFilters";

export default function ClassImports() {
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
    createImport,
    confirmImport,
  } = useClassImports();

  interface WarningItem {
    rowNumber: number | null;
    code: string;
    message: string;
    rawValue: string;
  }

  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [isMajorSelected, setIsMajorSelected] = useState<boolean>(false);
  const [allPrograms, setAllPrograms] = useState<{ id: string; program_code: string; program_name: string; major_name?: string | null }[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<{ id: string; class_code: string; class_name?: string }[]>([]);

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

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  useEffect(() => {
    if (isMajorSelected && selectedMajor) {
      updateFilters({ major_name: selectedMajor });
    } else {
      updateFilters({ major_name: undefined });
    }
  }, [isMajorSelected, selectedMajor, updateFilters]);

  useEffect(() => {
    if (!isMajorSelected || !selectedMajor || allPrograms.length === 0) return;
    const fetchClasses = async () => {
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<{ id: string; class_code: string; class_name?: string }[]>(`/classes?limit=100&program_id=${p.id}`)
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesList(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      }
    };
    void fetchClasses();
  }, [isMajorSelected, selectedMajor, allPrograms]);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setPreviewData(null);
    setPreviewWarnings([]);
    setActiveSessionId(null);
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      const data = await createImport(formData);
      if (data) {
        setPreviewData(data.preview ?? []);
        setPreviewWarnings(data.warnings ?? []);
        setActiveSessionId(data.importSession?.id ?? null);
      }
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Tải lên tệp thất bại.", true);
    }
  };

  const handleConfirmPreview = async (selectedStudents: ParsedStudentItem[]) => {
    if (!activeSessionId) return;
    try {
      const mappedStudents = selectedStudents.map((s) => ({
        student_code: s.studentCode,
        full_name: s.fullName,
        email: s.email,
      }));
      await confirmImport(activeSessionId, mappedStudents);
      showNotification("Thành công", "Xác nhận danh sách sinh viên lớp học và lưu vào DB thành công!");
      handleCloseModal();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Xác nhận phiên nhập thất bại.", true);
    }
  };

  const handleCancelPreview = async () => {
    if (activeSessionId) {
      try {
        await deleteItem(activeSessionId);
      } catch (e) {
        console.error("Failed to delete draft session:", e);
      }
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
          const errObj = err as { response?: { data?: { message?: string } }; message?: string };
          showNotification("Lỗi", errObj.response?.data?.message || errObj.message || "Xác nhận nhập dữ liệu thất bại.", true);
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
          await deleteItem(id);
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
        const statusMap = {
          PENDING: "CHỜ XỬ LÝ",
          SUCCESS: "THÀNH CÔNG",
          FAILED: "THẤT BẠI",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.import_status]}`}
          >
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
              {confirmingId === row.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
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

  if (!isMajorSelected) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <FolderInput className="text-indigo-400! h-8 w-8" />
            Nhập lớp học
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành mục tiêu.
          </p>
        </div>

        {loadingPrograms ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            Đang tải dữ liệu cấu hình hệ thống...
          </div>
        ) : (
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur-md space-y-6">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>

            <div className="space-y-4">
              {/* Major Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chuyên ngành
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                >
                  <option className="bg-slate-900 text-slate-500" value="">-- Chọn chuyên ngành --</option>
                  {uniqueMajors.map((major) => (
                    <option className="bg-slate-900 text-slate-100" key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedMajor) {
                  setIsMajorSelected(true);
                }
              }}
              disabled={!selectedMajor}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer hover:-translate-y-0.5"
            >
              Vào trang quản lý
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMajorSelected(false)}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Nhập lớp học</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Nhận các lô nhóm học tập, đăng ký danh sách sinh viên mới theo bảng lớp học. Đang làm việc với chuyên ngành: <span className="text-slate-200 font-semibold">{selectedMajor}</span>.
            </p>
          </div>
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
        searchPlaceholder="Tìm kiếm phiên nhập lớp..."
        filters={
          <ClassImportsFilters
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            classesList={classesList}
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
        onClose={previewData ? handleCancelPreview : handleCloseModal}
        title={
          previewData
            ? "Xem trước danh sách sinh viên lớp học"
            : "Bắt đầu phiên nhập sinh viên lớp học"
        }
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
