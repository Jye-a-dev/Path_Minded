import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCoursePrerequisites } from "../../../hooks/useCoursePrerequisites";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { PrerequisiteForm } from "./PrerequisiteForm";
import { Plus, Edit2, Trash2, GitFork, RefreshCw, List, Network } from "lucide-react";
import { api } from "../../../services/api";
import { CoursePrerequisitesFilters } from "./partials/CoursePrerequisitesFilters";
import { InteractiveGraph } from "../../../components/data_display/InteractiveGraph";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SelectionDetailsBanner } from "../../../components/ui/SelectionDetailsBanner";
import { SelectionScreen } from "../../../components/ui/SelectionScreen";

export default function CoursePrerequisites() {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [searchParams, setSearchParams] = useSearchParams();
  const persistedProgramId = searchParams.get("programId") || "";

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
  } = useCoursePrerequisites(
    { program_id: persistedProgramId || undefined },
    {
      skip: (f) => !f.program_id,
    }
  );

  useEffect(() => {
    if (persistedProgramId) {
      updateFilters({ program_id: persistedProgramId });
    }
  }, [persistedProgramId, updateFilters]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrerequisiteItem | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProgramDetails, setSelectedProgramDetails] = useState<{ program_code: string; program_name: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (filters.program_id) {
      api.get("/programs?limit=250")
        .then((res) => {
          if (!active) return;
          const list = res.data || [];
          const found = list.find((p: { id: string; program_code: string; program_name: string }) => p.id === filters.program_id);
          setSelectedProgramDetails(found || null);
        })
        .catch(console.error);
    } else {
      Promise.resolve().then(() => {
        if (active) {
          setSelectedProgramDetails(null);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [filters.program_id]);

  const handleSyncFromCurriculum = () => {
    if (!filters.program_id) return;
    setIsSyncConfirmOpen(true);
  };

  const executeSyncFromCurriculum = async () => {
    setSyncing(true);
    try {
      const response = await api.post(
        `/course_prerequisites/sync-from-curriculum?program_id=${filters.program_id}`
      );
      const count = response.data?.count ?? 0;
      alert(`Đồng bộ thành công! Đã tạo ${count} liên kết điều kiện môn học (Tiên quyết & Học trước).`);
      
      const currentProgramId = filters.program_id;
      clearFilters();
      setTimeout(() => {
        updateFilters({ program_id: currentProgramId });
      }, 50);
    } catch (err) {
      console.error("Failed to sync from curriculum:", err);
      alert(err instanceof Error ? err.message : "Đồng bộ thất bại");
    } finally {
      setSyncing(false);
    }
  };

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

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteItem(deletingId);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa điều kiện tiên quyết thất bại");
    } finally {
      setDeletingId(null);
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
        const statusMap: Record<string, string> = {
          REQUIRED: "TIÊN QUYẾT (BẮT BUỘC)",
          RECOMMENDED: "KHUYẾN NGHỊ",
          PREVIOUS: "MÔN HỌC TRƯỚC",
          OTHER: "KHÁC"
        };
        const getStyle = (type: string) => {
          switch (type) {
            case "REQUIRED":
              return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "PREVIOUS":
              return "bg-sky-500/10 text-sky-400 border-sky-500/20";
            case "RECOMMENDED":
              return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            default:
              return "bg-slate-500/10 text-slate-400 border-slate-500/20";
          }
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${getStyle(row.prerequisite_type)}`}
          >
            {statusMap[row.prerequisite_type] || "TIÊN QUYẾT (BẮT BUỘC)"}
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
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors animate-fade"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors animate-fade"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const handleSelectProgram = (programId: string) => {
    setSearchParams({ programId });
  };

  const handleClearProgram = () => {
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      {!filters.program_id && (
        <PageHeader
          title="Điều kiện môn học"
          description="Định nghĩa các yêu cầu trong đó việc hoàn thành các môn học tiên quyết cụ thể là điều kiện bắt buộc."
        />
      )}

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {!filters.program_id ? (
        <SelectionScreen
          icon={<GitFork className="h-6 w-6" />}
          title="Điều kiện môn học"
          description="Vui lòng chọn Ngành và Chương trình đào tạo để bắt đầu quản lý điều kiện tiên quyết."
          buttonText="Truy cập Điều kiện môn học"
          onSelect={handleSelectProgram}
        />
      ) : (
        /* Data Table Screen */
        <div className="space-y-6">
          <PageHeader
            title="Điều kiện môn học"
            description="Định nghĩa các yêu cầu trong đó việc hoàn thành các môn học tiên quyết cụ thể là điều kiện bắt buộc."
          />

          <SelectionDetailsBanner
            icon={<GitFork size={22} className="rotate-180" />}
            badge={selectedProgramDetails?.program_code}
            title={selectedProgramDetails?.program_name}
            description="Đang hiển thị danh sách các môn học tiên quyết được định nghĩa trong chương trình đào tạo này."
            buttonText="Thay đổi chương trình"
            onClear={handleClearProgram}
            rightActions={
              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950 p-1 shadow-inner">
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
            }
          />

          {viewMode === "table" ? (
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
                />
              }
              rightActions={
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={syncing}
                    onClick={handleSyncFromCurriculum}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-855 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    Đồng bộ từ Khung chương trình
                  </button>
                  <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    Tạo môn tiên quyết
                  </button>
                </div>
              }
            />
          ) : (
            <InteractiveGraph programId={filters.program_id as string} />
          )}
        </div>
      )}

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
          defaultProgramId={filters.program_id as string}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Sync Confirmation Modal */}
      <ConfirmModal
        isOpen={isSyncConfirmOpen}
        onClose={() => setIsSyncConfirmOpen(false)}
        title="Đồng bộ từ Khung chương trình"
        message={`Hệ thống sẽ đồng bộ hóa toàn bộ danh sách điều kiện môn học từ khung chương trình (bằng cách phân tích cột ĐK tiên quyết và Học trước).\n\nDữ liệu điều kiện môn học cũ của chương trình này sẽ bị xóa. Bạn có chắc chắn muốn tiếp tục?`}
        confirmText="Đồng bộ ngay"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={executeSyncFromCurriculum}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingId(null);
        }}
        title="Xóa điều kiện môn học"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn mối quan hệ điều kiện tiên quyết này?"
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={executeDelete}
      />
    </div>
  );
}
