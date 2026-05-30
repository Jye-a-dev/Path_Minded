import { useState } from "react";
import { useUsers } from "../../../hooks/useUsers";
import type { UserItem } from "../../../hooks/useUsers";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { UserForm } from "./UserForm";
import { Plus, Edit2, Trash2, Shield, User } from "lucide-react";

export default function Users() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    search,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: UserItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: { email: string; role: string; password?: string }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa người dùng thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Email",
      accessorKey: "email",
      render: (row: UserItem) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <span className="text-slate-200">{row.email}</span>
        </div>
      ),
    },
    {
      header: "Tên hiển thị",
      accessorKey: "display_name",
      render: (row: UserItem) => (
        <span className="text-slate-400 font-normal">{row.display_name || "Chưa cập nhật"}</span>
      ),
    },
    {
      header: "Vai trò",
      accessorKey: "role",
      render: (row: UserItem) => {
        const colors: Record<string, string> = {
          ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          ADVISOR: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          STUDENT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
        const roleMap: Record<string, string> = {
          ADMIN: "QUẢN TRỊ VIÊN",
          ADVISOR: "CỐ VẤN HỌC TẬP",
          STUDENT: "SINH VIÊN",
        };
        return (
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider border ${
              colors[row.role] || "bg-slate-500/10 text-slate-400 border-slate-500/20"
            }`}
          >
            <Shield size={10} />
            {roleMap[row.role] || row.role}
          </span>
        );
      },
    },
    {
      header: "Thao tác",
      render: (row: UserItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Danh sách người dùng</h1>
          <p className="mt-1 text-xs text-slate-400">
            Tạo, cập nhật và quản lý tài khoản hệ thống của sinh viên, cố vấn học tập và quản trị viên.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<UserItem>
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
        searchPlaceholder="Tìm kiếm email..."
        filters={
          <select
            value={(filters.role as string) || ""}
            onChange={(e) => updateFilters({ role: e.target.value || undefined })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option className="bg-slate-900 text-slate-100" value="">Tất cả vai trò</option>
            <option className="bg-slate-900 text-slate-100" value="STUDENT">Sinh viên</option>
            <option className="bg-slate-900 text-slate-100" value="ADVISOR">Cố vấn học tập</option>
            <option className="bg-slate-900 text-slate-100" value="ADMIN">Quản trị viên</option>
          </select>
        }
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo người dùng
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa vai trò tài khoản" : "Tạo tài khoản hệ thống"}
      >
        <UserForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
