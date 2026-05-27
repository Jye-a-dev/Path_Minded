import { useState } from "react";
import { useCurriculumCourses } from "../../../hooks/useCurriculumCourses";
import type { CourseItem } from "../../../hooks/useCurriculumCourses";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { CurriculumCourseForm } from "./CurriculumCourseForm";
import { getCurriculumCoursesColumns } from "./CurriculumCoursesColumns";
import { Plus, Trash2 } from "lucide-react";

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
    bulkDelete,
    deleteAll,
  } = useCurriculumCourses();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseItem | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    requirePromptText?: string;
    promptValue?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

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
    theory_hours: number | null;
    practice_hours: number | null;
    project_hours: number | null;
    internship_hours: number | null;
    prerequisite: string | null;
    corequisite: string | null;
    organizing_semester: string | null;
    sort_order: number | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa môn học",
      message: "Bạn có chắc chắn muốn xóa vĩnh viễn môn học này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa vĩnh viễn",
      cancelText: "Hủy bỏ",
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteItem(id);
          setSelectedIds((prev) => prev.filter((item) => item !== id));
        } catch (err) {
          setConfirmState({
            isOpen: true,
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Xóa môn học thất bại",
            confirmText: "Đóng",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: "Xác nhận xóa nhiều môn học",
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} môn học đã chọn? Hành động này không thể hoàn tác.`,
      confirmText: `Xóa ${selectedIds.length} môn`,
      cancelText: "Hủy bỏ",
      isDanger: true,
      onConfirm: async () => {
        try {
          await bulkDelete(selectedIds);
          setSelectedIds([]);
        } catch (err) {
          setConfirmState({
            isOpen: true,
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Xóa các môn học thất bại",
            confirmText: "Đóng",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  const handleDeleteAll = () => {
    setConfirmState({
      isOpen: true,
      title: "CẢNH BÁO CỰC KỲ QUAN TRỌNG",
      message: "Bạn đang chuẩn bị xóa TOÀN BỘ môn học trong khung chương trình!\nHành động này không thể hoàn tác.\nHãy gõ chữ 'DELETE' vào ô bên dưới để xác nhận xóa vĩnh viễn:",
      confirmText: "Xóa toàn bộ",
      cancelText: "Hủy",
      isDanger: true,
      requirePromptText: "DELETE",
      promptValue: "",
      onConfirm: async () => {
        try {
          await deleteAll();
          setSelectedIds([]);
        } catch (err) {
          setConfirmState({
            isOpen: true,
            title: "Lỗi",
            message: err instanceof Error ? err.message : "Xóa toàn bộ môn học thất bại",
            confirmText: "Đóng",
            onConfirm: () => {},
          });
        }
      },
    });
  };

  const columns = getCurriculumCoursesColumns(handleOpenEdit, handleDelete);

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

      {/* Custom Confirm Dialog Webform Component */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDanger={confirmState.isDanger}
        requirePromptText={confirmState.requirePromptText}
        promptValue={confirmState.promptValue}
        onPromptValueChange={(val) =>
          setConfirmState((prev) => ({ ...prev, promptValue: val }))
        }
        onConfirm={confirmState.onConfirm}
      />
    </div>
  );
}
