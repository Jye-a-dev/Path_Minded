import { useState } from "react";
import { useCourseTypeMappings } from "../../../hooks/useCourseTypeMappings";
import type { CourseTypeMappingItem, CourseTypeKey } from "../../../hooks/useCourseTypeMappings";
import { Tags, RefreshCw, Plus } from "lucide-react";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { CourseTypeCard } from "./CourseTypeCard";
import { ExcelColumnMappingSection } from "../../../components/data_display/ExcelColumnMappingSection";
import { CreateCourseTypeModal } from "./partials/CreateCourseTypeModal";
import { EditCourseTypeModal } from "./partials/EditCourseTypeModal";

export default function CourseTypeMappings() {
  const { data, loading, error, refresh, createItem, updateItem, deleteItem } = useCourseTypeMappings();

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items for edit/delete
  const [activeItem, setActiveItem] = useState<CourseTypeMappingItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleUpdate = async (id: string, payload: { phrases?: string[]; label?: string }) => {
    await updateItem(id, payload);
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: CourseTypeMappingItem) => {
    setActiveItem(item);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (item: CourseTypeMappingItem) => {
    setActiveItem(item);
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    try {
      await deleteItem(activeItem.id);
      setIsDeleteOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa";
      window.alert(`Lỗi: ${msg}`);
      throw err;
    }
  };

  // Sort by a fixed order
  const ORDER: CourseTypeKey[] = ["REQUIRED", "ELECTIVE", "ENGLISH", "PE", "DEFENSE", "OTHER"];
  const sorted = [...data].sort((a, b) => {
    const idxA = ORDER.indexOf(a.course_type);
    const idxB = ORDER.indexOf(b.course_type);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.course_type.localeCompare(b.course_type);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0 flex items-center gap-2.5">
            <Tags className="text-indigo-500" />
            Phân Loại Môn Học
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Cấu hình các từ khóa để tự động nhận diện và phân loại môn học khi import Excel chương trình đào tạo.
            Parser sẽ kiểm tra <strong className="text-slate-300">tên môn</strong>,{" "}
            <strong className="text-slate-300">mã môn</strong> và{" "}
            <strong className="text-slate-300">giá trị cột loại môn</strong> so với danh sách từ khóa bên dưới.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <Plus size={14} />
            Thêm loại môn
          </button>

          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Tải lại
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-300 leading-relaxed">
        <strong>💡 Cách hoạt động:</strong> Khi import Excel, hệ thống sẽ quét từng môn học và so sánh với các từ khóa đã cấu hình.
        Ưu tiên theo thứ tự: <span className="font-mono bg-indigo-500/10 px-1 rounded">PE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">DEFENSE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">ENGLISH</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">ELECTIVE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">REQUIRED</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">OTHER</span>.
        Từ khóa không phân biệt hoa thường.
      </div>

      {/* Cấu hình Nhận diện Cột Excel */}
      <ExcelColumnMappingSection
        fieldKey="course_type"
        title="Nhận diện Cột Loại môn học trong Excel"
        description="Định nghĩa các tiêu đề cột trong file Excel (không phân biệt hoa thường, khoảng trắng) để tự động nhận diện cột chứa dữ liệu loại môn (Bắt buộc / Tự chọn)."
        inputPlaceholder="Thêm tên cột Excel khác (VD: bb/tc)..."
      />

      {/* API Error */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && data.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-1/2 bg-slate-800 rounded" />
                  <div className="h-3 w-3/4 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-6 w-16 rounded-lg bg-slate-800" />
                ))}
              </div>
              <div className="h-8 rounded-lg bg-slate-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((item) => (
            <CourseTypeCard
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onEditLabel={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateCourseTypeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createItem}
      />

      {/* Edit Label Modal */}
      <EditCourseTypeModal
        key={activeItem?.id || "none"}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        item={activeItem}
        onSubmit={updateItem}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Xóa loại môn học"
        message={`Bạn có chắc chắn muốn xóa loại môn học "${activeItem?.label}" (${activeItem?.course_type}) không?
        
Hành động này sẽ xóa hoàn toàn cấu hình từ khóa phân loại này.
Lưu ý: Chỉ có thể xóa nếu không có môn học nào trong chương trình đào tạo hiện tại đang sử dụng loại môn này.`}
        confirmText="Xóa loại môn"
        isDanger={true}
        requirePromptText={activeItem?.course_type}
        promptValue={deleteConfirmText}
        onPromptValueChange={setDeleteConfirmText}
        onConfirm={handleDelete}
      />
    </div>
  );
}
