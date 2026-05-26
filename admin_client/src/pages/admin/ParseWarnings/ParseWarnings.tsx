import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { ParseWarningForm } from "./ParseWarningForm";

interface WarningItem {
  id: string;
  source_type: string;
  source_id: string;
  row_number?: number;
  warning_code?: string;
  warning_message?: string;
  raw_value?: string;
}

export default function ParseWarnings() {
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
  } = usePaginatedApi<WarningItem>("/parse_warnings");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarningItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: WarningItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    source_type: string;
    source_id: string;
    row_number: number | null;
    warning_code: string | null;
    warning_message: string | null;
    raw_value: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn cảnh báo phân tích này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa cảnh báo thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Nguồn (Loại / Mã)",
      render: (row: WarningItem) => (
        <div>
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold px-2 py-0.5 border border-rose-500/20 uppercase tracking-wide">
            <AlertTriangle size={10} />
            {row.source_type}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">{row.source_id}</span>
        </div>
      ),
    },
    {
      header: "Dòng số",
      accessorKey: "row_number",
      render: (row: WarningItem) => (
        <span className="font-mono text-xs font-semibold text-slate-400">
          #{row.row_number ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Mã cảnh báo",
      accessorKey: "warning_code",
      render: (row: WarningItem) => (
        <span className="text-slate-200 font-bold text-xs">{row.warning_code || "N/A"}</span>
      ),
    },
    {
      header: "Thông điệp cảnh báo",
      accessorKey: "warning_message",
      render: (row: WarningItem) => (
        <span className="text-slate-400 text-xs font-normal whitespace-normal block max-w-xs">{row.warning_message || "N/A"}</span>
      ),
    },
    {
      header: "Giá trị thô",
      accessorKey: "raw_value",
      render: (row: WarningItem) => (
        <span className="text-xs text-amber-400 font-mono max-w-37.5 truncate block" title={row.raw_value}>
          {row.raw_value || "N/A"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: WarningItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Cảnh báo phân tích</h1>
          <p className="mt-1 text-xs text-slate-400">
            Kiểm định các cờ cảnh báo định dạng và các lỗi phân tích cú pháp gặp phải trong quá trình nhập bảng điểm.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<WarningItem>
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
        searchPlaceholder="Tìm kiếm mã cảnh báo..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo cảnh báo
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa bản ghi cảnh báo phân tích" : "Tạo bản ghi cảnh báo phân tích mới"}
        size="lg"
      >
        <ParseWarningForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
