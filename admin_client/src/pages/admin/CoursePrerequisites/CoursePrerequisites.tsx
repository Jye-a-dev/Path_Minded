import { useState, useEffect } from "react";
import { useCoursePrerequisites } from "../../../hooks/useCoursePrerequisites";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { PrerequisiteForm } from "./PrerequisiteForm";
import { Plus, Edit2, Trash2, GitFork } from "lucide-react";
import { api } from "../../../services/api";
import { CoursePrerequisitesFilters } from "./partials/CoursePrerequisitesFilters";

export default function CoursePrerequisites() {
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
    createItem,
    updateItem,
    deleteItem,
  } = useCoursePrerequisites();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrerequisiteItem | null>(null);
  const [programsList, setProgramsList] = useState<{ id: string; program_code: string; program_name: string }[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get("/programs?limit=100");
        setProgramsList(response.data || []);
      } catch (err) {
        console.error("Failed to fetch programs list:", err);
      }
    };
    void fetchPrograms();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PrerequisiteItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    program_id: string;
    course_code: string;
    prerequisite_course_code: string;
    prerequisite_type: string;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn mối quan hệ điều kiện tiên quyết này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa điều kiện tiên quyết thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Môn học chính",
      accessorKey: "course_code",
      render: (row: PrerequisiteItem) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-bold text-indigo-400">{row.course_code}</span>
          {row.course_name && (
            <span className="text-[11px] text-slate-400 font-medium">{row.course_name}</span>
          )}
        </div>
      ),
    },
    {
      header: "Môn học tiên quyết",
      accessorKey: "prerequisite_course_code",
      render: (row: PrerequisiteItem) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <GitFork size={14} className="text-indigo-400 rotate-180" />
            <span className="font-mono text-xs font-bold text-slate-300">
              {row.prerequisite_course_code}
            </span>
          </div>
          {row.prerequisite_course_name && (
            <span className="text-[11px] text-slate-400 font-medium pl-5">{row.prerequisite_course_name}</span>
          )}
        </div>
      ),
    },
    {
      header: "Loại điều kiện",
      accessorKey: "prerequisite_type",
      render: (row: PrerequisiteItem) => {
        const isRequired = row.prerequisite_type === "REQUIRED";
        const statusMap: Record<string, string> = {
          REQUIRED: "BẮT BUỘC",
          RECOMMENDED: "KHUYẾN NGHỊ",
          PREVIOUS: "MÔN HỌC TRƯỚC",
          OTHER: "KHÁC"
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${
              isRequired
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {statusMap[row.prerequisite_type] || "BẮT BUỘC"}
          </span>
        );
      },
    },
    {
      header: "Thao tác",
      render: (row: PrerequisiteItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Điều kiện môn học</h1>
          <p className="mt-1 text-xs text-slate-400">
            Định nghĩa các yêu cầu trong đó việc hoàn thành các môn học tiên quyết cụ thể là điều kiện bắt buộc.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<PrerequisiteItem>
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
        searchPlaceholder="Tìm kiếm mã môn học..."
        filters={
          <CoursePrerequisitesFilters
            filters={filters}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            programsList={programsList}
          />
        }
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo môn tiên quyết
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa liên kết môn tiên quyết" : "Tạo liên kết môn tiên quyết mới"}
        size="lg"
      >
        <PrerequisiteForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
