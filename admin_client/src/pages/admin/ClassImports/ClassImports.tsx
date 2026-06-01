import { useState, useEffect } from "react";
import { useClassImports } from "../../../hooks/useClassImports";
import type { ClassImportItem as ImportItem } from "../../../hooks/useClassImports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { ClassImportForm } from "./ClassImportForm";
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

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [classesList, setClassesList] = useState<{ id: string; class_code: string; class_name?: string }[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/classes?limit=100");
        setClassesList(response.data || []);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      }
    };
    void fetchClasses();
  }, []);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (formData: FormData) => {
    await createImport(formData);
    setModalOpen(false);
  };

  const handleConfirmImport = async (id: string) => {
    setConfirmingId(id);
    try {
      await confirmImport(id);
      alert("Nhập danh sách sinh viên lớp học đã được xác nhận và xử lý thành công!");
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errObj.response?.data?.message || errObj.message || "Xác nhận nhập dữ liệu thất bại.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập lớp học này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa phiên thất bại");
      }
    }
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

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Nhập lớp học</h1>
          <p className="mt-1 text-xs text-slate-400">
            Nhận các lô nhóm học tập, đăng ký danh sách sinh viên mới theo bảng lớp học.
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
        onClose={handleCloseModal}
        title="Bắt đầu phiên nhập sinh viên lớp học"
        size="lg"
      >
        <ClassImportForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
