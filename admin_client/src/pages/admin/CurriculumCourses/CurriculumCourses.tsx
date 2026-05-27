import { useState, useEffect } from "react";
import { useCurriculumCourses } from "../../../hooks/useCurriculumCourses";
import type { CourseItem } from "../../../hooks/useCurriculumCourses";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { CurriculumCourseForm } from "./CurriculumCourseForm";
import { getCurriculumCoursesColumns } from "./CurriculumCoursesColumns";
import { Plus, Trash2, Eye, RefreshCw } from "lucide-react";
import { api } from "../../../services/api";

interface DropdownItem {
  id: string;
  label: string;
}

const allToggleableColumns = [
  { key: "course_code", label: "Mã môn" },
  { key: "course_name", label: "Tên môn học" },
  { key: "credits", label: "Số tín chỉ" },
  { key: "theory_hours", label: "LT" },
  { key: "practice_hours", label: "TH" },
  { key: "project_hours", label: "ĐA" },
  { key: "internship_hours", label: "TT" },
  { key: "course_type", label: "Loại môn" },
  { key: "prerequisite", label: "ĐK tiên quyết" },
  { key: "corequisite", label: "Học trước" },
  { key: "organizing_semester", label: "HK tổ chức" },
  { key: "expected_semester", label: "Học kỳ" },
  { key: "expected_year", label: "Năm thứ" },
  { key: "is_required", label: "Yêu cầu" },
];

export default function CurriculumCourses() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    clearFilters,
    createItem,
    updateItem,
    deleteItem,
    bulkDelete,
    deleteAll,
  } = useCurriculumCourses();

  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);

  useEffect(() => {
    api.get("/programs?limit=100")
      .then((res) => {
        setProgramsList(
          (res.data || []).map((p: { id: string; program_code: string }) => ({
            id: p.id,
            label: p.program_code,
          }))
        );
      })
      .catch((err) => console.error("Failed to fetch programs list:", err));
  }, []);

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CourseItem | null>(null);
  
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "course_code",
    "course_name",
    "credits",
    "theory_hours",
    "practice_hours",
    "project_hours",
    "internship_hours",
    "course_type",
    "prerequisite",
    "corequisite",
    "organizing_semester",
    "expected_semester",
    "expected_year",
    "is_required",
    "actions",
  ]);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
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

  const allColumns = getCurriculumCoursesColumns(handleOpenEdit, handleDelete);
  const columns = allColumns.filter((col) => {
    if (!col.accessorKey) return true;
    return visibleColumns.includes(col.accessorKey as string);
  });

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
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {/* Program Filter */}
            <select
              value={(filters?.program_id as string) || ""}
              onChange={(e) => updateFilters({ program_id: e.target.value || undefined })}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              <option className="bg-slate-900 text-slate-200" value="">-- Chương trình --</option>
              {programsList.map((p) => (
                <option className="bg-slate-900 text-slate-200" key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Course Type Filter */}
            <select
              value={(filters?.course_type as string) || ""}
              onChange={(e) => updateFilters({ course_type: e.target.value || undefined })}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              <option className="bg-slate-900 text-slate-200" value="">-- Loại môn --</option>
              <option className="bg-slate-900 text-slate-200" value="REQUIRED">Bắt buộc</option>
              <option className="bg-slate-900 text-slate-200" value="ELECTIVE">Tự chọn</option>
              <option className="bg-slate-900 text-slate-200" value="PE">Thể chất</option>
              <option className="bg-slate-900 text-slate-200" value="ENGLISH">Tiếng Anh</option>
              <option className="bg-slate-900 text-slate-200" value="DEFENSE">Quốc phòng</option>
              <option className="bg-slate-900 text-slate-200" value="OTHER">Khác</option>
            </select>

            {/* Semester Filter */}
            <select
              value={(filters?.expected_semester as string) || ""}
              onChange={(e) => updateFilters({ expected_semester: e.target.value ? Number(e.target.value) : undefined })}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
            >
              <option className="bg-slate-900 text-slate-200" value="">-- Học kỳ --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                <option className="bg-slate-900 text-slate-200" key={sem} value={sem}>
                  Học kỳ {sem}
                </option>
              ))}
            </select>

            {/* Reset Filters button */}
            {filters && !!(filters["program_id"] || filters["course_type"] || filters["expected_semester"]) && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <RefreshCw size={12} />
                Xóa lọc
              </button>
            )}
          </div>
        }
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Column Hiding Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
              >
                <Eye size={16} />
                Ẩn/Hiện Cột
              </button>
              {showColumnToggle && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-950 p-2.5 shadow-xl z-50 max-h-80 overflow-y-auto space-y-1.5 backdrop-blur-md">
                  <div className="text-[10px] font-bold text-slate-500 px-1.5 pb-1 border-b border-slate-800 uppercase tracking-wider">
                    Hiển thị cột
                  </div>
                  {allToggleableColumns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-800/60 rounded text-xs text-slate-300 cursor-pointer font-medium select-none"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setVisibleColumns([...visibleColumns, col.key]);
                          } else {
                            if (visibleColumns.length > 2) {
                              setVisibleColumns(visibleColumns.filter((k) => k !== col.key));
                            }
                          }
                        }}
                        className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

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
