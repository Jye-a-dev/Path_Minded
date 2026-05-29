import { useState, useEffect, useCallback } from "react";
import { useKnowledgeBlockMappings } from "../../../hooks/useKnowledgeBlockMappings";
import type { KnowledgeBlockMappingItem } from "../../../hooks/useKnowledgeBlockMappings";
import { Layers, RefreshCw, Plus, X, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { api } from "../../../services/api";
import { KnowledgeBlockCard } from "./KnowledgeBlockCard";
import type { ColMappingItem } from "./knowledgeBlockConfig";

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function KnowledgeBlockMappings() {
  const { data, loading, error, refresh, createItem, updateItem, deleteItem } = useKnowledgeBlockMappings();

  // Excel Column recognition states
  const [colMapping, setColMapping] = useState<ColMappingItem | null>(null);
  const [colSaving, setColSaving] = useState(false);
  const [newColPhrase, setNewColPhrase] = useState("");
  const [colError, setColError] = useState<string | null>(null);

  const fetchColMapping = useCallback(async () => {
    try {
      const res = await api.get<ColMappingItem[]>("/curriculum_column_mappings");
      const item = res.data.find((m) => m.field_key === "knowledge_block");
      if (item) {
        setColMapping(item);
      }
    } catch (err) {
      console.error("Lỗi khi tải cấu hình cột:", err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchColMapping();
    };
    void load();
  }, [fetchColMapping]);

  const handleAddColPhrase = async () => {
    const cleaned = newColPhrase.trim().toLowerCase();
    if (!cleaned || !colMapping) return;
    if (colMapping.phrases.includes(cleaned)) {
      setColError(`"${cleaned}" đã tồn tại`);
      return;
    }
    setColSaving(true);
    setColError(null);
    try {
      const updated = [...colMapping.phrases, cleaned];
      const res = await api.patch<ColMappingItem>(`/curriculum_column_mappings/${colMapping.id}`, { phrases: updated });
      setColMapping(res.data);
      setNewColPhrase("");
    } catch (err) {
      setColError(err instanceof Error ? err.message : "Lỗi khi thêm từ khóa");
    } finally {
      setColSaving(false);
    }
  };

  const handleRemoveColPhrase = async (phrase: string) => {
    if (!colMapping) return;
    setColSaving(true);
    setColError(null);
    try {
      const updated = colMapping.phrases.filter((p) => p !== phrase);
      const res = await api.patch<ColMappingItem>(`/curriculum_column_mappings/${colMapping.id}`, { phrases: updated });
      setColMapping(res.data);
    } catch (err) {
      setColError(err instanceof Error ? err.message : "Lỗi khi xóa từ khóa");
    } finally {
      setColSaving(false);
    }
  };

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Active items for edit/delete
  const [activeItem, setActiveItem] = useState<KnowledgeBlockMappingItem | null>(null);

  // Form states
  const [newTypeCode, setNewTypeCode] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypePhrases, setNewTypePhrases] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleUpdate = async (id: string, payload: { phrases?: string[]; label?: string }) => {
    await updateItem(id, payload);
  };

  const handleOpenCreate = () => {
    setNewTypeCode("");
    setNewTypeLabel("");
    setNewTypePhrases("");
    setActionError(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    const code = newTypeCode.trim().toUpperCase();
    const label = newTypeLabel.trim();
    if (!code || !label) {
      setActionError("Mã khối kiến thức và tên khối kiến thức không được để trống");
      return;
    }
    if (!/^[A-Z0-9_]{2,30}$/.test(code)) {
      setActionError("Mã khối phải từ 2-30 ký tự, chỉ gồm chữ in hoa, số và dấu gạch dưới");
      return;
    }

    const phrases = newTypePhrases
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    setSubmitting(true);
    setActionError(null);
    try {
      await createItem({ knowledge_block: code, label, phrases });
      setIsCreateOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (item: KnowledgeBlockMappingItem) => {
    setActiveItem(item);
    setEditLabel(item.label);
    setActionError(null);
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!activeItem) return;
    const label = editLabel.trim();
    if (!label) {
      setActionError("Tên khối không được để trống");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await updateItem(activeItem.id, { label });
      setIsEditOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (item: KnowledgeBlockMappingItem) => {
    setActiveItem(item);
    setDeleteConfirmText("");
    setActionError(null);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    setActionError(null);
    try {
      await deleteItem(activeItem.id);
      setIsDeleteOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra khi xóa";
      window.alert(`Lỗi: ${msg}`);
      throw err; // Keep modal open
    }
  };

  // Sort by a fixed order
  const ORDER = ["GENERAL", "SECTOR_CORE", "MAJOR_CORE", "SPECIALIZED"];
  const sorted = [...data].sort((a, b) => {
    const idxA = ORDER.indexOf(a.knowledge_block);
    const idxB = ORDER.indexOf(b.knowledge_block);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.knowledge_block.localeCompare(b.knowledge_block);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0 flex items-center gap-2.5">
            <Layers className="text-indigo-500" />
            Phân Loại Khối Kiến Thức
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Cấu hình các từ khóa để tự động nhận diện và phân loại môn học vào các Khối kiến thức chuẩn khi import Excel chương trình đào tạo.
            Parser sẽ đối khớp <strong className="text-slate-300">Tên khối/Nhóm môn</strong> so với danh sách từ khóa bên dưới.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <Plus size={14} />
            Thêm khối kiến thức
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
        <strong>💡 Cách hoạt động:</strong> Khi import Excel, hệ thống sẽ quét tên nhóm môn của học phần và so sánh với danh sách từ khóa đã cấu hình của từng Khối kiến thức (Đại cương, Cơ sở khối ngành, Cơ sở ngành, Chuyên ngành) để phân nhóm tự động.
        Từ khóa không phân biệt hoa thường.
      </div>

      {/* Cấu hình Nhận diện Cột Excel */}
      {colMapping && (
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/85 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  Nhận diện Cột Khối kiến thức trong Excel
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                    System Key: {colMapping.field_key}
                  </span>
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Định nghĩa các tiêu đề cột trong file Excel (không phân biệt hoa thường, khoảng trắng) để tự động nhận diện cột chứa dữ liệu Khối kiến thức.
                </p>
              </div>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0 self-start sm:self-center">
              {colMapping.phrases.length} tên cột được cấu hình
            </div>
          </div>

          {/* Phrase list */}
          <div className="flex flex-wrap gap-2 min-h-9">
            {colMapping.phrases.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Chưa cấu hình tên cột nào</span>
            ) : (
              colMapping.phrases.map((phrase: string) => (
                <span
                  key={phrase}
                  className="group flex items-center gap-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/20 px-3 py-1.5 text-xs text-slate-200 transition-all"
                >
                  {phrase}
                  <button
                    onClick={() => void handleRemoveColPhrase(phrase)}
                    disabled={colSaving}
                    className="ml-1 rounded text-slate-400 opacity-60 group-hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                    title="Xóa tên cột"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>

          {colError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20 w-fit">
              <AlertTriangle size={12} />
              {colError}
            </div>
          )}

          {/* Add Phrase Input */}
          <div className="flex gap-2.5 max-w-md">
            <input
              type="text"
              value={newColPhrase}
              onChange={(e) => {
                setNewColPhrase(e.target.value);
                setColError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddColPhrase();
              }}
              placeholder="Thêm tên cột Excel khác (VD: nhóm môn)..."
              disabled={colSaving}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => void handleAddColPhrase()}
              disabled={colSaving || !newColPhrase.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
            >
              <Plus size={14} />
              Thêm
            </button>
          </div>
        </div>
      )}

      {/* API Error */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && data.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
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
            <KnowledgeBlockCard
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
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm khối kiến thức mới"
        size="md"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20">
              <AlertTriangle size={12} className="shrink-0" />
              {actionError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mã khối kiến thức <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTypeCode}
              onChange={(e) => {
                setNewTypeCode(e.target.value);
                setActionError(null);
              }}
              placeholder="VD: GENERAL, SECTOR_CORE, SPECIALIZED"
              disabled={submitting}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all font-mono uppercase"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Chỉ cho phép chữ in hoa, số và dấu gạch dưới (A-Z, 0-9, _). Từ 2-30 ký tự.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tên khối kiến thức <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTypeLabel}
              onChange={(e) => {
                setNewTypeLabel(e.target.value);
                setActionError(null);
              }}
              placeholder="VD: Đại cương, Cơ sở ngành"
              disabled={submitting}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Từ khóa ban đầu (Phân tách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={newTypePhrases}
              onChange={(e) => {
                setNewTypePhrases(e.target.value);
                setActionError(null);
              }}
              placeholder="VD: đại cương, cơ sở ngành, chuyên sâu"
              disabled={submitting}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
            />
            <p className="text-[10px] text-slate-500 leading-normal">
              Không phân biệt hoa thường. Các từ khóa sẽ tự động chuyển thành chữ thường.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting || !newTypeCode.trim() || !newTypeLabel.trim()}
              onClick={handleCreate}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? "Đang tạo..." : "Thêm khối"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Label Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Sửa tên khối kiến thức"
        size="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20">
              <AlertTriangle size={12} className="shrink-0" />
              {actionError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Mã khối
            </label>
            <input
              type="text"
              value={activeItem?.knowledge_block || ""}
              disabled={true}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500 transition-all font-mono opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tên khối kiến thức <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => {
                setEditLabel(e.target.value);
                setActionError(null);
              }}
              placeholder="Nhập tên khối kiến thức..."
              disabled={submitting}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-700 focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting || !editLabel.trim()}
              onClick={handleEdit}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-lg transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? "Đang lưu..." : "Cập nhật"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Xóa khối kiến thức"
        message={`Bạn có chắc chắn muốn xóa khối kiến thức "${activeItem?.label}" (${activeItem?.knowledge_block}) không?
        
Hành động này sẽ xóa hoàn toàn cấu hình từ khóa phân loại này.
Lưu ý: Chỉ có thể xóa nếu không có môn học nào trong chương trình đào tạo hiện tại đang sử dụng khối kiến thức này.`}
        confirmText="Xóa khối"
        isDanger={true}
        requirePromptText={activeItem?.knowledge_block}
        promptValue={deleteConfirmText}
        onPromptValueChange={setDeleteConfirmText}
        onConfirm={handleDelete}
      />
    </div>
  );
}
