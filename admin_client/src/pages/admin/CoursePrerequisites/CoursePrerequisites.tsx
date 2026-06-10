import { useState, useEffect } from "react";
import { useReloadPersistentState } from "../../../hooks/useReloadPersistentState";
import { useCoursePrerequisites } from "../../../hooks/useCoursePrerequisites";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { PrerequisiteForm } from "./PrerequisiteForm";
import { Plus, Edit2, Trash2, GitFork, RefreshCw, ArrowRight } from "lucide-react";
import { api } from "../../../services/api";
import { CoursePrerequisitesFilters } from "./partials/CoursePrerequisitesFilters";

export default function CoursePrerequisites() {
  const [persistedProgramId, setPersistedProgramId] = useReloadPersistentState("selected_prerequisites_program_id", "");

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
      setPersistedProgramId(selectedProgram);
      updateFilters({ program_id: selectedProgram });
    }
  };

  const handleClearProgram = () => {
    setPersistedProgramId("");
    updateFilters({ program_id: undefined });
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
        /* Dropdown Major and Program Selection Screen (Identical to SelectionScreen) */
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[65vh]">
          <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
            {/* Glow effect */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GitFork className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">Điều kiện môn học</h2>
              <p className="mt-2 text-xs text-slate-400">
                Vui lòng chọn Ngành và Chương trình đào tạo để bắt đầu quản lý điều kiện tiên quyết.
              </p>
            </div>

            {loadingPrograms ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span>Đang tải thông tin chương trình...</span>
              </div>
            ) : (
              <div className="mt-8 space-y-6 relative z-10">
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
              </div>
            )}
          </div>
        </div>
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
            <div>
              <button
                onClick={handleClearProgram}
                className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer"
              >
                Thay đổi chương trình
              </button>
            </div>
          </div>

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
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Tạo môn tiên quyết
              </button>
            }
          />
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
    </div>
  );
}
