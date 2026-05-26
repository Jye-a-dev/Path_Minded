import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { CheckCircle2, Trash2, Plus } from "lucide-react";
import { CurriculumImportForm } from "./CurriculumImportForm";
import { CurriculumImportPreview } from "./CurriculumImportPreview";

interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
}

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface ImportItem {
  id: string;
  advisor_id?: string;
  program_id: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string;
  uploaded_at: string;
  processed_at?: string;
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
    deleteItem,
    refresh,
  } = usePaginatedApi<ImportItem>("/curriculum_imports");

  const [modalOpen, setModalOpen] = useState(false);

  const [previewData, setPreviewData] = useState<CoursePreviewItem[] | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sheetsList, setSheetsList] = useState<string[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

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
      const response = await api.post("/curriculum_imports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data) {
        setPreviewData(response.data.preview ?? []);
        setPreviewWarnings(response.data.warnings ?? []);
        setActiveSessionId(response.data.importSession?.id ?? null);
        setSheetsList(response.data.sheets ?? []);
        setActiveSheetIndex(response.data.activeSheetIndex ?? 0);
      }
      refresh();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errObj.response?.data?.message || errObj.message || "Tải lên tệp thất bại.");
    }
  };

  const handleConfirmPreview = async (selectedCourses: CoursePreviewItem[]) => {
    if (!activeSessionId) return;
    try {
      await api.post(`/curriculum_imports/${activeSessionId}/confirm`, {
        courses: selectedCourses,
      });
      alert("Xác nhận phiên nhập chương trình học và lưu vào DB thành công!");
      handleCloseModal();
      refresh();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errObj.response?.data?.message || errObj.message || "Xác nhận phiên nhập thất bại.");
    }
  };

  const handleCancelPreview = async () => {
    if (activeSessionId) {
      try {
        await api.delete(`/curriculum_imports/${activeSessionId}`);
      } catch (e) {
        console.error("Failed to delete draft session:", e);
      }
    }
    handleCloseModal();
    refresh();
  };

  const handleSheetChange = async (idx: number) => {
    if (!activeSessionId) return;
    try {
      const response = await api.post(`/curriculum_imports/${activeSessionId}/reparse`, {
        sheetIndex: idx,
      });
      if (response.data) {
        setPreviewData(response.data.preview ?? []);
        setPreviewWarnings(response.data.warnings ?? []);
        setSheetsList(response.data.sheets ?? []);
        setActiveSheetIndex(response.data.activeSheetIndex ?? 0);
      }
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errObj.response?.data?.message || errObj.message || "Chuyển đổi trang tính thất bại.");
    }
  };

  const handleConfirmImport = () => {
    alert(
      "Phiên nhập này chưa được xác nhận hoàn tất. Vui lòng bấm '+ Phiên nhập mới' để tải lên lại và nhấn 'Xác nhận Nhập vào DB' ở bảng xem trước."
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa phiên thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Tên tệp / Nguồn",
      accessorKey: "file_name",
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
              onClick={() => handleConfirmImport()}
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 size={12} />
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
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Nhập chương trình học</h1>
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
        size="lg"
      >
        {previewData ? (
          <CurriculumImportPreview
            key={`${activeSessionId}-${activeSheetIndex}`}
            courses={previewData}
            warnings={previewWarnings}
            sheets={sheetsList}
            activeSheetIndex={activeSheetIndex}
            onConfirm={handleConfirmPreview}
            onCancel={handleCancelPreview}
            onSheetChange={handleSheetChange}
          />
        ) : (
          <CurriculumImportForm
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        )}
      </Modal>
    </div>
  );
}
