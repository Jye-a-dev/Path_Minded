import { useState } from "react";
import { useStudents } from "../../../hooks/useStudents";
import type { StudentItem } from "../../../hooks/useStudents";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { StudentForm } from "./StudentForm";
import { Plus, Edit2, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { api } from "../../../services/api";
import { useColumnLabels } from "../../../hooks/useColumnLabels";
import { useClassLookup } from "../../../hooks/useClassLookup";

export default function Students() {
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
  } = useStudents();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  const { getLabel } = useColumnLabels("CLASS");
  const { getClassName } = useClassLookup();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    student_code: string;
    full_name: string;
    cohort_year: number | null;
    status: "ACTIVE" | "GRADUATED" | "DROPPED";
    user_id: string | null;
    class_id: string | null;
    program_id: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ Sinh viên này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa sinh viên thất bại");
      }
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    setDeleteAllError(null);
    try {
      await api.delete("/students");
      setDeleteAllOpen(false);
      await refresh();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setDeleteAllError(errObj.response?.data?.message || errObj.message || "Xóa tất cả sinh viên thất bại.");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const columns = [
    {
      header: getLabel("student_code", "Mã số"),
      accessorKey: "student_code",
      render: (row: StudentItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.student_code}</span>
      ),
    },
    {
      header: getLabel("full_name", "Họ và tên"),
      accessorKey: "full_name",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-emerald-400" />
          <span className="text-slate-200 font-bold">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: "Khóa",
      accessorKey: "cohort_year",
      render: (row: StudentItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      render: (row: StudentItem) => {
        const statuses = {
          ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          GRADUATED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          DROPPED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = {
          ACTIVE: "ĐANG HỌC",
          GRADUATED: "TỐT NGHIỆP",
          DROPPED: "THÔI HỌC",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border ${statuses[row.status]}`}
          >
            {statusMap[row.status]}
          </span>
        );
      },
    },
    {
      header: "Lớp học",
      accessorKey: "class_id",
      render: (row: StudentItem) => (
        <span className="text-xs font-medium text-slate-300">{getClassName(row.class_id)}</span>
      ),
    },
    {
      header: "Mã chương trình",
      accessorKey: "program_id",
      render: (row: StudentItem) => (
        <span className="text-xs text-slate-400">{row.program_id || "Chưa chỉ định"}</span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: StudentItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Danh bạ Sinh viên</h1>
          <p className="mt-1 text-xs text-slate-400">
            Xem, tạo, sửa, xóa các hàng cơ sở dữ liệu sinh viên, bản đồ chương trình học và liên kết với tài khoản người dùng hệ thống.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<StudentItem>
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
        searchPlaceholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
        filters={
          <select
            value={(filters.status as string) || ""}
            onChange={(e) => updateFilters({ status: e.target.value || undefined })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option className="bg-slate-900 text-slate-100" value="">Tất cả trạng thái</option>
            <option className="bg-slate-900 text-slate-100" value="ACTIVE">ĐANG HỌC</option>
            <option className="bg-slate-900 text-slate-100" value="GRADUATED">TỐT NGHIỆP</option>
            <option className="bg-slate-900 text-slate-100" value="DROPPED">THÔI HỌC</option>
          </select>
        }
        rightActions={
          <>
            <button
              onClick={() => { setDeleteAllError(null); setDeleteAllOpen(true); }}
              disabled={total === 0 || loading}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              Xóa tất cả
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo sinh viên
            </button>
          </>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa cấu hình Sinh viên" : "Đăng ký hồ sơ Sinh viên"}
        size="lg"
      >
        <StudentForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={deleteAllOpen}
        onClose={() => !deleteAllLoading && setDeleteAllOpen(false)}
        title="Xác nhận xóa tất cả sinh viên"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-sm font-semibold text-rose-300">
              ⚠️ Hành động này <span className="font-black underline">không thể hoàn tác</span>.
            </p>
            <p className="mt-1.5 text-xs text-rose-400/80">
              Toàn bộ <span className="font-bold text-rose-300">{total.toLocaleString()} sinh viên</span> trong cơ sở dữ liệu sẽ bị xóa vĩnh viễn, bao gồm tất cả dữ liệu liên kết.
            </p>
          </div>

          {deleteAllError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {deleteAllError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteAllOpen(false)}
              disabled={deleteAllLoading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {deleteAllLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Xóa tất cả {total.toLocaleString()} sinh viên
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
