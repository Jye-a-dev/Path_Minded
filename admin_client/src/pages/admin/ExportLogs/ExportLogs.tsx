import { useState } from "react";
import { useExportLogs } from "../../../hooks/useExportLogs";
import type { ExportLogItem as LogItem } from "../../../hooks/useExportLogs";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2, History } from "lucide-react";
import { ExportLogForm } from "./ExportLogForm";

export default function ExportLogs() {
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
    createItem,
    updateItem,
    deleteItem,
  } = useExportLogs();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LogItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: LogItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    export_id: string;
    student_count: number | null;
    course_count: number | null;
    success_count: number | null;
    warning_count: number | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn nhật ký xuất dữ liệu này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa nhật ký xuất dữ liệu thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Mã nhật ký",
      accessorKey: "id",
      render: (row: LogItem) => (
        <div className="flex items-center gap-2">
          <History size={16} className="text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{row.id}</span>
        </div>
      ),
    },
    {
      header: "Phiên xuất dữ liệu",
      accessorKey: "export_id",
      render: (row: LogItem) => (
        <span className="text-xs text-slate-400 font-mono">{row.export_id}</span>
      ),
    },
    {
      header: "Số liệu (Sinh viên / Môn học)",
      render: (row: LogItem) => (
        <span className="text-slate-300 font-semibold text-xs">
          {row.student_count ?? 0} sinh viên / {row.course_count ?? 0} môn học
        </span>
      ),
    },
    {
      header: "Kết quả kiểm định",
      render: (row: LogItem) => (
        <div className="text-xs">
          <span className="text-emerald-400 font-bold font-mono">
            {row.success_count ?? 0} Hợp lệ{" "}
          </span>
          <span className="text-amber-400 font-bold font-mono">
            / {row.warning_count ?? 0} Cảnh báo
          </span>
        </div>
      ),
    },
    {
      header: "Thao tác",
      render: (row: LogItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Lịch sử xuất</h1>
          <p className="mt-1 text-xs text-slate-400">
            Kiểm tra các dòng cơ sở dữ liệu xuất bản ghi theo dõi sinh viên được xử lý, số lượng đề cương và cờ cảnh báo ma trận.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<LogItem>
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
        searchPlaceholder="Tìm kiếm nhật ký xuất..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Thêm nhật ký xuất
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa nhật ký xuất kiểm định" : "Tạo nhật ký xuất kiểm định mới"}
        size="lg"
      >
        <ExportLogForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
