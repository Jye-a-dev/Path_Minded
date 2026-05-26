import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { ClassImportRowForm } from "./ClassImportRowForm";

interface RowItem {
  id: string;
  import_id: string;
  row_number?: number;
  student_code?: string;
  full_name?: string;
  email?: string;
  row_status: "PENDING" | "SUCCESS" | "FAILED";
  row_error?: string;
}

export default function ClassImportRows() {
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
  } = usePaginatedApi<RowItem>("/class_import_rows");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RowItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: RowItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    import_id: string;
    row_number: number | null;
    student_code: string | null;
    full_name: string | null;
    email: string | null;
    row_status: "PENDING" | "SUCCESS" | "FAILED";
    row_error: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn hàng nhập này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa hàng nhập thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Dòng số",
      accessorKey: "row_number",
      render: (row: RowItem) => (
        <span className="font-mono text-xs font-semibold text-slate-400">
          #{row.row_number ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Chi tiết sinh viên",
      render: (row: RowItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-200 block">{row.student_code || "N/A"}</span>
          <span className="text-xs text-slate-400 font-semibold block">{row.full_name || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      render: (row: RowItem) => (
        <span className="text-slate-400 font-normal text-xs">{row.email || "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "row_status",
      render: (row: RowItem) => {
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
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.row_status]}`}
          >
            {statusMap[row.row_status]}
          </span>
        );
      },
    },
    {
      header: "Nhật ký lỗi",
      accessorKey: "row_error",
      render: (row: RowItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block" title={row.row_error}>
          {row.row_error || "Không có"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: RowItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Chi tiết hàng nhập lớp</h1>
          <p className="mt-1 text-xs text-slate-400">
            Kiểm tra từng dòng hồ sơ được phân tích cú pháp bên trong các tệp lô CSV nhập sinh viên lớp học.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<RowItem>
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
        searchPlaceholder="Tìm kiếm mã sinh viên hoặc tên..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo dòng
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa dòng hồ sơ nhập" : "Tạo dòng hồ sơ nhập mới"}
        size="lg"
      >
        <ClassImportRowForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
