import { useState, useEffect, useCallback } from "react";
import { usePrograms } from "../../../hooks/usePrograms";
import type { ProgramItem } from "../../../hooks/usePrograms";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { ProgramForm } from "./ProgramForm";
import { Plus, Edit2, Trash2, BookOpen, GraduationCap, ChevronLeft, LayoutGrid, Loader2, Search, X, Filter } from "lucide-react";
import { api } from "../../../services/api";

export default function Programs() {
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
  } = usePrograms();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);

  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);
  const [allMajors, setAllMajors] = useState<string[]>([]);
  const [allVersions, setAllVersions] = useState<string[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(true);
  const [majorSearch, setMajorSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ProgramItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [majorRefreshKey, setMajorRefreshKey] = useState(0);
  const refreshMajors = useCallback(() => {
    setLoadingMajors(true);
    setMajorRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get<ProgramItem[]>("/programs?limit=250")
      .then((res) => {
        if (cancelled) return;
        const list = res.data || [];
        const uniqueMajors = Array.from(
          new Set(list.map((p) => p.major_name).filter((m): m is string => !!m))
        );
        setAllMajors(uniqueMajors);

        const uniqueVersions = Array.from(
          new Set(list.map((p) => p.version).filter((v): v is string => !!v))
        ).sort();
        setAllVersions(uniqueVersions);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load majors:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingMajors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [majorRefreshKey]);

  const handleSelectMajor = (major: string | null) => {
    setSelectedMajor(major);
    updateFilters({
      major_name: major && major !== "TẤT CẢ" ? major : undefined,
      version: undefined,
      total_credits: undefined,
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    updateFilters({
      version: undefined,
      total_credits: undefined,
    });
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ProgramItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    program_code: string;
    program_name: string;
    major_name: string | null;
    version: string | null;
    total_credits: number | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
    refreshMajors();
  };

  const handleDelete = (row: ProgramItem) => {
    setDeleteError(null);
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      refreshMajors();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa chương trình thất bại");
    }
  };

  const columns = [
    {
      header: "Mã chương trình",
      accessorKey: "program_code",
      render: (row: ProgramItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 text-indigo-400 font-mono text-xs px-2 py-0.5 border border-indigo-900/40">
          <BookOpen size={10} />
          {row.program_code}
        </span>
      ),
    },
    {
      header: "Tên chương trình",
      accessorKey: "program_name",
      render: (row: ProgramItem) => (
        <span className="text-slate-200 font-bold">{row.program_name}</span>
      ),
    },
    {
      header: "Tên chuyên ngành",
      accessorKey: "major_name",
      render: (row: ProgramItem) => (
        <span className="text-slate-400 font-normal">{row.major_name || "N/A"}</span>
      ),
    },
    {
      header: "Phiên bản",
      accessorKey: "version",
      render: (row: ProgramItem) => (
        <span className="text-slate-400 font-semibold">{row.version || "N/A"}</span>
      ),
    },
    {
      header: "Tín chỉ",
      accessorKey: "total_credits",
      render: (row: ProgramItem) => (
        <span className="text-slate-300 font-semibold">{row.total_credits ?? "N/A"}</span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: ProgramItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (selectedMajor === null) {
    const gradients = [
      "from-indigo-600 to-indigo-900 shadow-indigo-950/40 border-indigo-500/20",
      "from-teal-600 to-emerald-900 shadow-emerald-950/40 border-emerald-500/20",
      "from-blue-600 to-cyan-900 shadow-cyan-950/40 border-cyan-500/20",
      "from-purple-650 to-pink-900 shadow-purple-950/40 border-purple-500/20",
      "from-amber-600 to-orange-900 shadow-orange-950/40 border-orange-500/20",
      "from-rose-600 to-rose-900 shadow-rose-950/40 border-rose-500/20",
    ];

    const filteredMajors = allMajors.filter((major) =>
      major.toLowerCase().includes(majorSearch.toLowerCase())
    );

    return (
      <div className="space-y-8">
        {/* Title Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0 flex items-center gap-2.5">
              <GraduationCap className="text-indigo-400 h-7 w-7" />
              Chương trình đào tạo
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Vui lòng chọn chuyên ngành dưới đây để bắt đầu xem danh sách chương trình đào tạo tương ứng.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer w-fit"
          >
            <Plus size={16} />
            Tạo Chương trình
          </button>
        </div>

        {/* Search & Stats Bar */}
        {!loadingMajors && allMajors.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute top-2.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm chuyên ngành..."
                value={majorSearch}
                onChange={(e) => setMajorSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-10 pr-10 py-2 text-sm text-slate-100 placeholder-slate-550 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all duration-300"
              />
              {majorSearch && (
                <button
                  onClick={() => setMajorSearch("")}
                  className="absolute top-2 right-2.5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Hiển thị <span className="text-indigo-400 font-bold">{filteredMajors.length}</span> / <span className="text-slate-300">{allMajors.length}</span> chuyên ngành
            </div>
          </div>
        )}

        {loadingMajors ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            Đang tải danh sách chuyên ngành...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            {/* Show All Card */}
            {(!majorSearch || "tất cả chuyên ngành".includes(majorSearch.toLowerCase())) && (
              <div
                onClick={() => handleSelectMajor("TẤT CẢ")}
                className="group relative rounded-2xl border bg-slate-900/60 p-6 flex flex-col justify-between hover:bg-slate-850/80 hover:border-slate-700 transition-all duration-300 cursor-pointer h-40 border-slate-800 shadow-lg shadow-slate-950/50 hover:-translate-y-1.5"
              >
                <div className="rounded-xl bg-slate-800/80 p-2.5 w-fit group-hover:bg-indigo-600 group-hover:text-white transition-all text-slate-400">
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Tất cả chuyên ngành</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Xem toàn bộ chương trình đào tạo của hệ thống</p>
                </div>
              </div>
            )}

            {/* Major Cards */}
            {filteredMajors.map((major, idx) => {
              const gradient = gradients[idx % gradients.length];
              return (
                <div
                  key={major}
                  onClick={() => handleSelectMajor(major)}
                  className={`group relative rounded-2xl border bg-linear-to-br ${gradient} p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer h-40 hover:-translate-y-1.5`}
                >
                  <div className="rounded-xl bg-white/10 p-2.5 w-fit group-hover:bg-white/20 transition-all text-white">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug drop-shadow-sm">{major}</h3>
                    <p className="text-[10px] text-white/70 mt-1 uppercase tracking-wider font-semibold">Chuyên ngành</p>
                  </div>
                </div>
              );
            })}

            {filteredMajors.length === 0 && allMajors.length > 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                <Search size={40} className="text-slate-600 mb-3" />
                <p className="text-xs font-semibold text-slate-400">Không tìm thấy chuyên ngành nào phù hợp</p>
                <p className="text-[10px] text-slate-500 mt-1">Vui lòng thử tìm kiếm bằng từ khóa khác.</p>
              </div>
            )}

            {allMajors.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                <GraduationCap size={40} className="text-slate-600 mb-3" />
                <p className="text-xs font-semibold text-slate-400">Chưa có chuyên ngành nào trong hệ thống</p>
                <p className="text-[10px] text-slate-500 mt-1">Bấm nút "Tạo Chương trình" ở góc trên bên phải để bắt đầu thiết lập.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Popup */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Tạo Chương trình đào tạo mới"
        >
          <ProgramForm
            key="create"
            editingItem={null}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSelectMajor(null)}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn chuyên ngành"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Chương trình đào tạo</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor === "TẤT CẢ" ? "Tất cả chuyên ngành" : selectedMajor}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Định nghĩa các ma trận đề cương học thuật, trình độ học vị và ngưỡng tín chỉ tốt nghiệp.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ProgramItem>
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
        searchPlaceholder="Tìm kiếm mã hoặc tên chương trình..."
        filters={
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter icon or label */}
            <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider pr-1">
              <Filter size={12} className="text-indigo-400" />
              <span>Bộ lọc:</span>
            </div>

            {/* Major Filter Dropdown */}
            <select
              value={selectedMajor || ""}
              onChange={(e) => handleSelectMajor(e.target.value || null)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <option className="bg-slate-900 text-slate-100" value="TẤT CẢ">
                Tất cả chuyên ngành
              </option>
              {allMajors.map((major) => (
                <option className="bg-slate-900 text-slate-100" key={major} value={major}>
                  {major}
                </option>
              ))}
            </select>

            {/* Version Filter Dropdown */}
            <select
              value={(filters.version as string) || ""}
              onChange={(e) => updateFilters({ version: e.target.value || undefined })}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <option className="bg-slate-900 text-slate-100" value="">
                Tất cả phiên bản
              </option>
              {allVersions.map((v) => (
                <option className="bg-slate-900 text-slate-100" key={v} value={v}>
                  Phiên bản {v}
                </option>
              ))}
            </select>

            {/* Total Credits Input */}
            <input
              type="number"
              placeholder="Tín chỉ..."
              value={(filters.total_credits as string) || ""}
              onChange={(e) => {
                const val = e.target.value;
                updateFilters({ total_credits: val ? Number(val) : undefined });
              }}
              className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none hover:border-slate-700 transition-all"
            />

            {/* Clear Filters Button */}
            {(search || filters.version || filters.total_credits !== undefined) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-355 font-semibold px-2 py-1.5 rounded bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
              >
                <X size={12} />
                Xóa lọc
              </button>
            )}
          </div>
        }
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo Chương trình
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa Chương trình đào tạo" : "Tạo Chương trình đào tạo mới"}
      >
        <ProgramForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => { setDeleteTarget(null); setDeleteError(null); }}
        title="Xóa Chương trình đào tạo"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn chương trình "${deleteTarget?.program_name}"?\n\nHành động này không thể hoàn tác.${deleteError ? `\n\n⚠ ${deleteError}` : ""}`}
        confirmText="Xóa vĩnh viễn"
        isDanger
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
