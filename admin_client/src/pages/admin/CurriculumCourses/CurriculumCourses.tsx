import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { CurriculumCourseForm } from "./CurriculumCourseForm";
import { Plus, Edit2, Trash2, Bookmark } from "lucide-react";
import { api } from "../../../services/api";

interface CourseItem {
  id: string;
  program_id: string;
  course_code: string;
  course_name: string;
  credits?: number;
  expected_semester?: number;
  course_group?: string;
  course_type: "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";
  is_required: boolean;
  sort_order?: number;
}

export default function CurriculumCourses() {
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
    refresh,
  } = usePaginatedApi<CourseItem>("/curriculum_courses");

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CourseItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    program_id: string;
    course_code: string;
    course_name: string;
    credits: number | null;
    expected_semester: number | null;
    course_group: string | null;
    course_type: "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";
    is_required: boolean;
    sort_order: number | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn môn học này?")) {
      try {
        await deleteItem(id);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa môn học thất bại");
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} môn học đã chọn?`)) {
      try {
        await api.delete("/curriculum_courses/bulk", { data: { ids: selectedIds } });
        setSelectedIds([]);
        alert("Đã xóa các môn học đã chọn thành công!");
        await refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa các môn học thất bại");
      }
    }
  };

  const handleDeleteAll = async () => {
    const confirmation = window.prompt(
      "CẢNH BÁO CỰC KỲ QUAN TRỌNG: Bạn đang chuẩn bị xóa TOÀN BỘ môn học trong khung chương trình!\nHành động này không thể hoàn tác.\nHãy gõ chữ 'DELETE' để xác nhận xóa vĩnh viễn:"
    );
    if (confirmation === "DELETE") {
      try {
        await api.delete("/curriculum_courses/all");
        setSelectedIds([]);
        alert("Đã xóa toàn bộ môn học trong khung chương trình thành công!");
        await refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa toàn bộ môn học thất bại");
      }
    } else if (confirmation !== null) {
      alert("Xác nhận không khớp. Không thực hiện xóa.");
    }
  };

  const columns = [
    {
      header: "Mã môn",
      accessorKey: "course_code",
      render: (row: CourseItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.course_code}</span>
      ),
    },
    {
      header: "Tên môn học",
      accessorKey: "course_name",
      render: (row: CourseItem) => (
        <div className="flex items-center gap-2">
          <Bookmark size={16} className="text-indigo-400" />
          <span className="text-slate-200 font-bold whitespace-normal">{row.course_name}</span>
        </div>
      ),
    },
    {
      header: "Số tín chỉ",
      accessorKey: "credits",
      render: (row: CourseItem) => (
        <span className="text-slate-400 font-semibold">{row.credits ?? "N/A"}</span>
      ),
    },
    {
      header: "Học kỳ",
      accessorKey: "expected_semester",
      render: (row: CourseItem) => (
        <span className="text-slate-400 font-semibold">{row.expected_semester ?? "N/A"}</span>
      ),
    },
    {
      header: "Loại môn",
      accessorKey: "course_type",
      render: (row: CourseItem) => {
        const badges = {
          REQUIRED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          ELECTIVE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          PE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          ENGLISH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          DEFENSE: "bg-pink-500/10 text-pink-400 border-pink-500/20",
          OTHER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        };
        const statusMap = {
          REQUIRED: "BẮT BUỘC",
          ELECTIVE: "TỰ CHỌN",
          PE: "THỂ CHẤT",
          ENGLISH: "TIẾNG ANH",
          DEFENSE: "QUỐC PHÒNG",
          OTHER: "KHÁC",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.course_type]}`}
          >
            {statusMap[row.course_type]}
          </span>
        );
      },
    },
    {
      header: "Yêu cầu",
      accessorKey: "is_required",
      render: (row: CourseItem) => (
        <span className={`text-xs font-semibold ${row.is_required ? "text-emerald-400" : "text-slate-500"}`}>
          {row.is_required ? "Có" : "Không"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: CourseItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Học phần khung</h1>
          <p className="mt-1 text-xs text-slate-400">
            Định nghĩa chi tiết đề cương môn học, phân bổ học kỳ và mô hình tín chỉ của chương trình đào tạo.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<CourseItem>
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
        searchPlaceholder="Tìm kiếm mã môn hoặc tên môn..."
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 px-3.5 py-2 text-sm font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 hover:text-white transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Xóa đã chọn ({selectedIds.length})
              </button>
            )}

            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600/10 px-3.5 py-2 text-sm font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-600/20 hover:text-amber-300 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
              Xóa tất cả môn học
            </button>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo Môn học
            </button>
          </div>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa môn học học phần khung" : "Thêm môn học vào học phần khung"}
        size="lg"
      >
        <CurriculumCourseForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
