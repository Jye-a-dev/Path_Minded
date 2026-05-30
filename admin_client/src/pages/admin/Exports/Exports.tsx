import { useState } from "react";
import { useExports } from "../../../hooks/useExports";
import type { ExportItem } from "../../../hooks/useExports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, DownloadCloud, Trash2 } from "lucide-react";
import { ExportForm } from "./ExportForm";

export default function Exports() {
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
    createExport,
  } = useExports();

  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    class_id: string;
    program_id: string | null;
    advisor_id: string | null;
  }) => {
    await createExport(payload);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi xuất dữ liệu này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa bản ghi xuất thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Chi tiết tệp",
      render: (row: ExportItem) => (
        <div>
          <span className="text-slate-200 font-bold block">{row.file_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Loại xuất",
      accessorKey: "export_type",
      render: (row: ExportItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase tracking-wide">
          {row.export_type}
        </span>
      ),
    },
    {
      header: "Thời gian tạo",
      accessorKey: "created_at",
      render: (row: ExportItem) => (
        <span className="text-xs text-slate-450 font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Đường dẫn tải xuống",
      accessorKey: "file_path",
      render: (row: ExportItem) => (
        <span className="text-xs text-slate-400 font-mono max-w-62.5 truncate block" title={row.file_path}>
          {row.file_path || "Đang xử lý..."}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: ExportItem) => (
        <div className="flex items-center gap-2">
          {row.file_path && (
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition"
            >
              <DownloadCloud size={12} />
              Tải tệp
            </a>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Xuất dữ liệu</h1>
          <p className="mt-1 text-xs text-slate-400">
            Xuất bảng tính ma trận kiểm định học tập để kiểm tra tiến trình học tập theo niên khóa và lớp học.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ExportItem>
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
        searchPlaceholder="Tìm kiếm tên tệp xuất..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Xuất ma trận
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Chạy quy trình xuất bảng tính ma trận"
        size="lg"
      >
        <ExportForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
