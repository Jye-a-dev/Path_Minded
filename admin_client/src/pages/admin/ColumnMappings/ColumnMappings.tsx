import { useState } from "react";
import { useCurriculumColumnMappings } from "../../../hooks/useCurriculumColumnMappings";
import type { MappingItem } from "../../../hooks/useCurriculumColumnMappings";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { MappingCard } from "./components/MappingCard";
import { CreateMappingModal } from "./components/CreateMappingModal";
import { EditMappingModal } from "./components/EditMappingModal";
import { FileSpreadsheet, Plus, Search, RefreshCw, HelpCircle } from "lucide-react";

export default function ColumnMappings() {
  const {
    data: mappings,
    loading,
    error: apiError,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  } = useCurriculumColumnMappings();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");

  // Modal open/close flags
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Selected item contexts
  const [selectedMapping, setSelectedMapping] = useState<MappingItem | null>(null);
  const [deletePromptValue, setDeletePromptValue] = useState("");

  const systemKeys = [
    "course_code",
    "course_name",
    "credits",
    "theory_hours",
    "practice_hours",
    "project_hours",
    "internship_hours",
    "expected_semester",
    "course_type",
    "prerequisite",
    "corequisite",
    "organizing_semester",
    "student_code",
    "full_name",
    "email",
  ];

  // Helper to add phrase to mapping
  const handleAddPhrase = async (mapping: MappingItem, phraseToAdd: string) => {
    const cleaned = phraseToAdd.trim().toLowerCase();
    if (!cleaned || mapping.phrases.includes(cleaned)) return;
    try {
      await updateItem(mapping.id, { phrases: [...mapping.phrases, cleaned] });
    } catch (err) {
      console.error("Lỗi khi thêm từ khóa:", err);
    }
  };

  // Helper to delete phrase from mapping
  const handleDeletePhrase = async (mapping: MappingItem, phraseToRemove: string) => {
    const updatedPhrases = mapping.phrases.filter((p) => p !== phraseToRemove);
    try {
      await updateItem(mapping.id, { phrases: updatedPhrases });
    } catch (err) {
      console.error("Lỗi khi xóa từ khóa:", err);
    }
  };

  // Actions trigger callbacks
  const handleOpenEdit = (mapping: MappingItem) => {
    setSelectedMapping(mapping);
    setEditModalOpen(true);
  };

  const handleOpenDelete = (mapping: MappingItem) => {
    setSelectedMapping(mapping);
    setDeletePromptValue("");
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMapping) return;
    try {
      await deleteItem(selectedMapping.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter and Search matching
  const filteredMappings = mappings.filter((item) => {
    const matchesSearch =
      item.display_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.field_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phrases.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));

    const isSystem = systemKeys.includes(item.field_key);
    const matchesType =
      filterType === "all" ||
      (filterType === "system" && isSystem) ||
      (filterType === "custom" && !isSystem);

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0 flex items-center gap-2.5">
            <FileSpreadsheet className="text-indigo-500" />
            Quy Tắc Khớp Cột Excel
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Định nghĩa các cụm từ khóa tiếng Việt/Anh dùng để khớp và tự động nhận diện
            cột tiêu đề khi tải lên tệp Excel chương trình đào tạo hoặc danh sách sinh viên lớp học.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer w-fit"
        >
          <Plus size={15} />
          Thêm cấu hình khớp
        </button>
      </div>

      {apiError && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {apiError}
        </div>
      )}

      {/* Toolbar / Search bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm theo khóa, nhãn hiển thị hoặc từ khóa khớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Pills buttons */}
        <div className="flex items-center gap-1 bg-slate-950/85 p-1 rounded-lg border border-slate-800 shrink-0 w-full md:w-auto overflow-x-auto">
          {(["all", "system", "custom"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer capitalize ${
                filterType === type
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {type === "all" ? "Tất cả" : type === "system" ? "Hệ thống" : "Tùy biến"}
            </button>
          ))}
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer shrink-0 w-full md:w-auto justify-center"
        >
          <RefreshCw size={14} />
          Tải lại
        </button>
      </div>

      {/* Main Grid / Skeletons */}
      {loading && mappings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 animate-pulse"
            >
              <div className="h-6 w-2/3 bg-slate-850 rounded" />
              <div className="h-4 w-1/3 bg-slate-850 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-10 w-full bg-slate-850 rounded" />
                <div className="h-8 w-1/2 bg-slate-850 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMappings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 py-16 px-4 text-center">
          <div className="rounded-full bg-slate-800/40 p-4 text-slate-500 mb-4">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-sm font-bold text-slate-300">Không tìm thấy quy tắc nào</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Không tìm thấy cấu hình khớp cột Excel nào phù hợp với từ khóa của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMappings.map((item) => (
            <MappingCard
              key={item.id}
              item={item}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onAddPhrase={handleAddPhrase}
              onDeletePhrase={handleDeletePhrase}
            />
          ))}
        </div>
      )}

      {/* CREATE NEW CONFIGURATION MODAL */}
      {createModalOpen && (
        <CreateMappingModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={createItem}
        />
      )}

      {/* EDIT CONFIGURATION MODAL */}
      {editModalOpen && (
        <EditMappingModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          mapping={selectedMapping}
          onSubmit={updateItem}
        />
      )}

      {/* CONFIRM DELETE MODAL */}
      {selectedMapping && (
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title="Xóa cấu hình khớp cột?"
          message={`Bạn có chắc chắn muốn xóa vĩnh viễn quy tắc khớp cột "${selectedMapping.display_label}" (${selectedMapping.field_key})?\n\nHành động này có thể làm mất khả năng tự động khớp của các cột tiêu đề Excel có tên liên quan nếu không có quy tắc thay thế.`}
          confirmText="Xóa vĩnh viễn"
          isDanger={true}
          requirePromptText={selectedMapping.field_key}
          promptValue={deletePromptValue}
          onPromptValueChange={setDeletePromptValue}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
