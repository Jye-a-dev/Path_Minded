import { useState } from "react";
import { useUsers } from "../../../hooks/useUsers";
import type { UserItem } from "../../../hooks/useUsers";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { UserForm } from "./UserForm";
import { Plus, Edit2, Trash2, Shield, User, Loader2 } from "lucide-react";
import { api } from "../../../services/api";

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
    refresh,
  } = useUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UserItem | null>(null);

  // Single-delete confirm modal state
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk-delete state
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────

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

  const handleSubmit = async (payload: { email: string; role: string; password?: string; display_name?: string }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteItem(deleteTarget.id);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa người dùng thất bại");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    setBulkDeleteError(null);
    try {
      await api.delete("/users", { data: { ids: selectedIds } });
      setSelectedIds([]);
      await refresh();
      setBulkDeleteOpen(false);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setBulkDeleteError(e.response?.data?.message || e.message || "Xóa thất bại.");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // ── Columns ───────────────────────────────────────────────

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
      header: "Tên người dùng",
      accessorKey: "display_name",
      render: (row: UserItem) => (
        <span className={row.display_name ? "text-slate-200 font-medium" : "text-slate-600 italic"}>
          {row.display_name || "Chưa cập nhật"}
        </span>
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
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Chỉnh sửa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────

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

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
          <span className="text-sm font-semibold text-indigo-300">
            Đã chọn <span className="font-extrabold text-white">{selectedIds.length}</span> người dùng
          </span>
          <button
            onClick={() => { setBulkDeleteError(null); setBulkDeleteOpen(true); }}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300 transition-all cursor-pointer"
          >
            <Trash2 size={13} />
            Xóa {selectedIds.length} người dùng đã chọn
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Bỏ chọn tất cả
          </button>
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
        searchPlaceholder="Tìm kiếm email hoặc tên..."
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa thông tin tài khoản" : "Tạo tài khoản hệ thống"}
      >
        <UserForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Single Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Xác nhận xóa người dùng"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-sm font-semibold text-rose-300">
              ⚠️ Hành động này <span className="font-black underline">không thể hoàn tác</span>.
            </p>
            <p className="mt-1.5 text-xs text-rose-400/80">
              Người dùng{" "}
              <span className="font-bold text-rose-300 font-mono">{deleteTarget?.email}</span>{" "}
              sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleDeleteSingle}
              disabled={deleteLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {deleteLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Xóa người dùng
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirm Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => !bulkDeleteLoading && setBulkDeleteOpen(false)}
        title="Xác nhận xóa nhiều người dùng"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-sm font-semibold text-rose-300">
              ⚠️ Hành động này <span className="font-black underline">không thể hoàn tác</span>.
            </p>
            <p className="mt-1.5 text-xs text-rose-400/80">
              <span className="font-bold text-rose-300">{selectedIds.length} người dùng</span> đã chọn sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>
          </div>

          {bulkDeleteError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {bulkDeleteError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setBulkDeleteOpen(false)}
              disabled={bulkDeleteLoading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {bulkDeleteLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Xóa {selectedIds.length} người dùng
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
