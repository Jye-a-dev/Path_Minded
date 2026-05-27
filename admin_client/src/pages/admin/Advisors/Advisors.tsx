import { useState } from "react";
import { useAdvisors } from "../../../hooks/useAdvisors";
import type { AdvisorItem } from "../../../hooks/useAdvisors";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { AdvisorForm } from "./AdvisorForm";
import { Plus, Edit2, Trash2, Briefcase, Link2 } from "lucide-react";

export default function Advisors() {
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
  } = useAdvisors();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdvisorItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AdvisorItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    full_name: string;
    department: string | null;
    user_id: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn Cố vấn học tập này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa cố vấn học tập thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Họ và tên",
      accessorKey: "full_name",
      render: (row: AdvisorItem) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-400" />
          <span className="text-slate-200 font-bold">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: "Khoa / Ban",
      accessorKey: "department",
      render: (row: AdvisorItem) => (
        <span className="text-slate-400 font-normal">{row.department || "N/A"}</span>
      ),
    },
    {
      header: "Tài khoản liên kết",
      accessorKey: "user_id",
      render: (row: AdvisorItem) => (
        <span className="text-xs text-slate-400">
          {row.user_id ? (
            <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40">
              <Link2 size={12} />
              {row.user_id}
            </span>
          ) : (
            <span className="text-slate-600">Chưa liên kết</span>
          )}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: AdvisorItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Danh sách Cố vấn</h1>
          <p className="mt-1 text-xs text-slate-400">
            Quản lý cố vấn học tập, nhóm khoa ban và liên kết họ với tài khoản đăng nhập hệ thống.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<AdvisorItem>
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
        searchPlaceholder="Tìm kiếm tên cố vấn..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo Cố vấn
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa thông tin Cố vấn" : "Tạo hồ sơ Cố vấn"}
      >
        <AdvisorForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
