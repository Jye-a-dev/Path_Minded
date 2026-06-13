import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCoursePrerequisites } from "../../../hooks/useCoursePrerequisites";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { PrerequisiteForm } from "./PrerequisiteForm";
import { Plus, Edit2, Trash2, GitFork, RefreshCw, ArrowRight, List, Network } from "lucide-react";
import { api } from "../../../services/api";
import { CoursePrerequisitesFilters } from "./partials/CoursePrerequisitesFilters";
import { InteractiveGraph } from "../../../components/data_display/InteractiveGraph";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { SelectionCard } from "../../../components/ui/SelectionCard";

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
  
  // Program lists and selection states
  const [programsList, setProgramsList] = useState<{ id: string; program_code: string; program_name: string; major_name?: string | null; version?: string | null }[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=200");
        setProgramsList(response.data || []);
      } catch (err) {
        console.error("Failed to fetch programs list:", err);
      } finally {
        setLoadingPrograms(false);
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

  const majors = Array.from(
    new Set(
      programsList
        .map((p) => p.major_name?.trim() || "")
        .filter((m) => !!m)
    )
  ).sort();

  const filteredPrograms = programsList.filter((p) => {
    if (!selectedMajor) return false;
    return p.major_name?.trim() === selectedMajor;
  });

  const handleEnter = () => {
    if (selectedProgram) {
      setSearchParams({ programId: selectedProgram });
    }
  };

  const handleClearProgram = () => {
    setSearchParams({});
    setSelectedProgram("");
    setSelectedMajor("");
  };

  const selectedProgramDetails = programsList.find((p) => p.id === filters.program_id);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      {!filters.program_id && (
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Điều kiện môn học</h1>
          <p className="text-xs text-slate-400">
            Định nghĩa các yêu cầu trong đó việc hoàn thành các môn học tiên quyết cụ thể là điều kiện bắt buộc.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {!filters.program_id ? (
        <SelectionCard
          icon={<GitFork className="h-6 w-6 text-white" />}
          title="Điều kiện môn học"
          description="Vui lòng chọn Ngành và Chương trình đào tạo để bắt đầu quản lý điều kiện tiên quyết."
          loading={loadingPrograms}
          loadingText="Đang tải thông tin chương trình..."
        >
          {/* Sector / Major Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Ngành học (Major)
            </label>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setSelectedProgram(""); // reset program when major changes
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
            >
              <option value="">-- Chọn ngành học --</option>
              {majors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Program Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Chương trình đào tạo (Program)
            </label>
            <select
              disabled={!selectedMajor}
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">-- Chọn chương trình học --</option>
              {filteredPrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.program_name} {p.version ? `(Phiên bản ${p.version})` : ""} - {p.program_code}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={!selectedProgram}
            onClick={handleEnter}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer font-bold"
          >
            Truy cập Điều kiện môn học
            <ArrowRight className="h-4 w-4" />
          </button>
        </SelectionCard>
      ) : (
        /* Data Table Screen */
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Điều kiện môn học</h1>
            <p className="text-xs text-slate-400">
              Định nghĩa các yêu cầu trong đó việc hoàn thành các môn học tiên quyết cụ thể là điều kiện bắt buộc.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <GitFork size={22} className="rotate-180" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-400 tracking-wide uppercase bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    {selectedProgramDetails?.program_code}
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedProgramDetails?.program_name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đang hiển thị danh sách các môn học tiên quyết được định nghĩa trong chương trình đào tạo này.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle Switch */}
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

              <button
                onClick={handleClearProgram}
                className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer"
              >
                Thay đổi chương trình
              </button>
            </div>
          </div>

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
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
