import { useState, useEffect } from "react";
import { useCurriculumCourses } from "../../../hooks/useCurriculumCourses";
import type { CourseItem } from "../../../hooks/useCurriculumCourses";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { CurriculumCourseForm } from "./CurriculumCourseForm";
import { getCurriculumCoursesColumns } from "./CurriculumCoursesColumns";
import { Plus, Trash2, ArrowLeft, List, Network } from "lucide-react";
import { api } from "../../../services/api";
import { ColumnVisibilityToggle } from "./partials/ColumnVisibilityToggle";
import { CurriculumCoursesFilters } from "./partials/CurriculumCoursesFilters";
import { useColumnLabels } from "../../../hooks/useColumnLabels";
import { InteractiveGraph } from "../../../components/data_display/InteractiveGraph";

interface DropdownItem {
  id: string;
  label: string;
}

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name: string | null;
  version: string | null;
}

interface CurriculumCoursesManagerProps {
  selectedProgramId: string;
  onBack: () => void;
}

export const CurriculumCoursesManager: React.FC<CurriculumCoursesManagerProps> = ({
  selectedProgramId,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
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
  } = useCurriculumCourses({ program_id: selectedProgramId });

  const { getLabel } = useColumnLabels("CURRICULUM");

  const [programsList, setProgramsList] = useState<DropdownItem[]>([]);
  const [knowledgeBlocks, setKnowledgeBlocks] = useState<DropdownItem[]>([]);
  const [rawKnowledgeBlocks, setRawKnowledgeBlocks] = useState<Array<{ id: string; label: string }>>([]);
  const [activeProgramName, setActiveProgramName] = useState<string>("");

  useEffect(() => {
    Promise.all([
      api.get("/programs?limit=200"),
      api.get("/knowledge_block_mappings"),
    ])
      .then(([progRes, kbRes]) => {
        const progs = progRes.data || [];
        setProgramsList(
          progs.map((p: ProgramItem) => ({
            id: p.id,
            label: p.program_code,
          }))
        );

        // Find and set name of selected program
        const found = progs.find((p: ProgramItem) => p.id === selectedProgramId);
        if (found) {
          setActiveProgramName(`${found.program_name} (${found.program_code})`);
        }

        const kbs = kbRes.data || [];
        setRawKnowledgeBlocks(
          kbs.map((k: { knowledge_block: string; label: string }) => ({
            id: k.knowledge_block,
            label: k.label,
          }))
        );

        setKnowledgeBlocks(
          kbs.map((k: { knowledge_block: string; label: string }) => ({
            id: k.knowledge_block,
            label: `${k.label} (${k.knowledge_block})`,
          }))
        );
      })
      .catch((err) => console.error("Failed to fetch curriculum options:", err));
  }, [selectedProgramId]);

  // Set default initial program filter on mount
  useEffect(() => {
    updateFilters({ program_id: selectedProgramId });
  }, [selectedProgramId, updateFilters]);

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
    "knowledge_block",
    "prerequisite",
    "corequisite",
    "organizing_semester",
    "expected_semester",
    "expected_year",
    "is_required",
    "actions",
  ]);

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
    knowledge_block: string | null;
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

  const allColumns = getCurriculumCoursesColumns(handleOpenEdit, handleDelete, rawKnowledgeBlocks, getLabel);
  const columns = allColumns.filter((col) => {
    if (!col.accessorKey) return true;
    return visibleColumns.includes(col.accessorKey as string);
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Học phần khung</h1>
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={12} />
              Đổi chương trình
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Đang quản lý chương trình: <strong className="text-indigo-400 font-bold">{activeProgramName || "N/A"}</strong>
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 self-start sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <List size={13} />
            Dạng bảng
          </button>
          <button
            type="button"
            onClick={() => setViewMode("graph")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              viewMode === "graph"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Network size={13} />
            Sơ đồ trực quan
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      {viewMode === "table" ? (
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
            <CurriculumCoursesFilters
              filters={filters}
              updateFilters={updateFilters}
              clearFilters={clearFilters}
              selectedProgramId={selectedProgramId}
              programsList={programsList}
              knowledgeBlocks={knowledgeBlocks}
            />
          }
          rightActions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Column Hiding Toggle */}
              <ColumnVisibilityToggle
                visibleColumns={visibleColumns}
                onChange={setVisibleColumns}
              />

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
      ) : (
        <InteractiveGraph programId={selectedProgramId} />
      )}

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
          defaultProgramId={selectedProgramId}
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
};
