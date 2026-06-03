import { useState, useEffect } from "react";
import { useClasses } from "../../../hooks/useClasses";
import type { ClassItem } from "../../../hooks/useClasses";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ClassForm } from "./ClassForm";
import { Plus, Edit2, Trash2, Building2, RefreshCw, ArrowRight } from "lucide-react";
import { api } from "../../../services/api";

export default function Classes() {
  const [initialProgramId] = useState(() => {
    return sessionStorage.getItem("selected_classes_program_id") || "";
  });

  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    search,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useClasses(
    {
      program_id: initialProgramId || undefined,
    },
    {
      skip: (f) => !f.program_id,
    }
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);

  const [programsList, setProgramsList] = useState<{ id: string; program_name: string; program_code: string; major_name?: string | null; version?: string | null }[]>([]);
  const [advisorsList, setAdvisorsList] = useState<{ id: string; full_name: string }[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Selection states
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingPrograms(true);
      try {
        const [programsRes, advisorsRes] = await Promise.all([
          api.get("/programs?limit=250"),
          api.get("/advisors?limit=100"),
        ]);
        setProgramsList(programsRes.data || []);
        setAdvisorsList(advisorsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch filter metadata:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchMetadata();
  }, []);

  const getProgramCode = (programId?: string) => {
    if (!programId) return "Chưa chỉ định";
    const found = programsList.find((p) => p.id === programId);
    return found ? `${found.program_name} (${found.program_code})` : "N/A";
  };

  const getAdvisorName = (advisorId?: string) => {
    if (!advisorId) return "Chưa phân công";
    const found = advisorsList.find((a) => a.id === advisorId);
    return found ? found.full_name : "N/A";
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    advisor_id: string | null;
    program_id: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn Lớp học này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa lớp học thất bại");
      }
    }
  };

  const uniqueMajors = Array.from(
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
      sessionStorage.setItem("selected_classes_program_id", selectedProgram);
      updateFilters({
        program_id: selectedProgram,
      });
    }
  };

  const handleClearSelection = () => {
    sessionStorage.removeItem("selected_classes_program_id");
    updateFilters({
      program_id: undefined,
    });
    setSelectedProgram("");
    setSelectedMajor("");
  };

  const selectedProgramDetails = programsList.find((p) => p.id === filters.program_id);

  const columns = [
    {
      header: "Mã lớp học",
      accessorKey: "class_code",
      render: (row: ClassItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 text-indigo-400 font-mono text-xs px-2 py-0.5 border border-indigo-900/40">
          <Building2 size={10} />
          {row.class_code}
        </span>
      ),
    },
    {
      header: "Tên lớp học",
      accessorKey: "class_name",
      render: (row: ClassItem) => (
        <span className="text-slate-200 font-bold">{row.class_name || "N/A"}</span>
      ),
    },
    {
      header: "Niên khóa",
      accessorKey: "cohort_year",
      render: (row: ClassItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Cố vấn học tập",
      accessorKey: "advisor_id",
      render: (row: ClassItem) => (
        <span className="text-xs text-slate-300 font-semibold">
          {getAdvisorName(row.advisor_id)}
        </span>
      ),
    },
    {
      header: "Chương trình đào tạo",
      accessorKey: "program_id",
      render: (row: ClassItem) => (
        <span className="text-xs text-slate-300 font-semibold">
          {getProgramCode(row.program_id)}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: ClassItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
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
      {!filters.program_id && (
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Lớp học Sinh viên</h1>
          <p className="text-xs text-slate-400">
            Tổ chức các nhóm học tập theo niên khóa và liên kết chúng với cố vấn học tập và khung chương trình đào tạo.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {!filters.program_id ? (
        /* Selection Screen */
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[65vh]">
          <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
            {/* Glow effect */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">Lớp học Sinh viên</h2>
              <p className="mt-2 text-xs text-slate-400">
                Vui lòng chọn Ngành và Chương trình đào tạo để bắt đầu quản lý danh sách lớp học.
              </p>
            </div>

            {loadingPrograms ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span>Đang tải thông tin...</span>
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
                      setSelectedProgram("");
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                  >
                    <option value="">-- Chọn ngành học --</option>
                    {uniqueMajors.map((m) => (
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
                        {p.program_name} - {p.program_code}
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
                  Truy cập Lớp học
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
            <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Lớp học Sinh viên</h1>
            <p className="text-xs text-slate-400">
              Tổ chức các nhóm học tập theo niên khóa và liên kết chúng với cố vấn học tập và khung chương trình đào tạo.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <Building2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-400 tracking-wide uppercase bg-indigo-955/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    {selectedProgramDetails?.program_code}
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    {selectedProgramDetails?.program_name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đang hiển thị danh sách lớp học thuộc chương trình đã chọn.
                </p>
              </div>
            </div>
            <div>
              <button
                onClick={handleClearSelection}
                className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-855 hover:border-slate-700 transition-all cursor-pointer"
              >
                Thay đổi chương trình
              </button>
            </div>
          </div>

          <DataTable<ClassItem>
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
            searchPlaceholder="Tìm kiếm mã lớp học hoặc tên lớp..."
            filters={
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Advisor Filter */}
                <select
                  value={(filters?.advisor_id as string) || ""}
                  onChange={(e) => updateFilters({ advisor_id: e.target.value || undefined })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-45"
                >
                  <option className="bg-slate-900 text-slate-400" value="">Tất cả cố vấn</option>
                  {advisorsList.map((a) => (
                    <option className="bg-slate-900 text-slate-200" key={a.id} value={a.id}>
                      {a.full_name}
                    </option>
                  ))}
                </select>

                {/* Cohort Year Filter */}
                <select
                  value={(filters?.cohort_year as string) || ""}
                  onChange={(e) => updateFilters({ cohort_year: e.target.value ? Number(e.target.value) : undefined })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-40"
                >
                  <option className="bg-slate-900 text-slate-400" value="">Tất cả niên khóa</option>
                  {Array.from({ length: 9 }, (_, i) => 2018 + i).map((year) => (
                    <option className="bg-slate-900 text-slate-200" key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            }
            rightActions={
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Tạo Lớp học
              </button>
            }
          />
        </div>
      )}

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa cấu hình Lớp học" : "Tạo Lớp học mới"}
      >
        <ClassForm
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
