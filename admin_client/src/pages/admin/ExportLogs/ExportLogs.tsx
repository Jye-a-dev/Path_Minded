import { useState, useEffect } from "react";
import { useExportLogs } from "../../../hooks/useExportLogs";
import type { ExportLogItem as LogItem } from "../../../hooks/useExportLogs";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { Plus, Edit2, Trash2, History, Filter, X, ArrowRight, RefreshCw } from "lucide-react";
import { ExportLogForm } from "./ExportLogForm";
import { api } from "../../../services/api";

export default function ExportLogs() {
  const [initialProgramId] = useState(() => {
    return sessionStorage.getItem("selected_export_logs_program_id") || "";
  });

  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    filters: activeFilters,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useExportLogs(
    {
      program_id: initialProgramId || undefined,
    },
    {
      skip: (f) => !f.program_id,
    }
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LogItem | null>(null);

  const [classesList, setClassesList] = useState<{ id: string; class_code: string; class_name: string | null; program_id?: string | null }[]>([]);
  const [programsList, setProgramsList] = useState<{ id: string; program_code: string; program_name: string; major_name?: string | null; version?: string | null }[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Selection states
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<LogItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiltersMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [classesRes, programsRes] = await Promise.all([
          api.get("/classes?limit=250"),
          api.get("/programs?limit=250"),
        ]);
        setClassesList(classesRes.data || []);
        setProgramsList(programsRes.data || []);
      } catch (err) {
        console.error("Failed to load export log filter metadata:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    void fetchFiltersMetadata();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: LogItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    export_id: string;
    student_count: number | null;
    course_count: number | null;
    success_count: number | null;
    warning_count: number | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (row: LogItem) => {
    setDeleteError(null);
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa nhật ký xuất thất bại");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    updateFilters({
      class_id: undefined,
    });
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
      sessionStorage.setItem("selected_export_logs_program_id", selectedProgram);
      updateFilters({
        program_id: selectedProgram,
      });
    }
  };

  const handleClearSelection = () => {
    sessionStorage.removeItem("selected_export_logs_program_id");
    updateFilters({
      program_id: undefined,
      class_id: undefined,
    });
    setSelectedProgram("");
    setSelectedMajor("");
  };

  const selectedProgramDetails = programsList.find((p) => p.id === activeFilters.program_id);

  const columns = [
    {
      header: "Mã nhật ký",
      accessorKey: "id",
      render: (row: LogItem) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <History size={13} className="text-indigo-400" />
            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {row.id.substring(0, 8)}...
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono select-all truncate max-w-40" title={row.id}>
            {row.id}
          </span>
        </div>
      ),
    },
    {
      header: "Tệp xuất & Phiên",
      render: (row: LogItem) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-200 font-bold text-xs max-w-60 truncate block" title={row.file_name}>
            {row.file_name || "Chưa có tên tệp"}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ID: {row.export_id}
          </span>
        </div>
      ),
    },
    {
      header: "Thông tin Lớp / Ngành",
      render: (row: LogItem) => (
        <div className="flex flex-col gap-0.5">
          {row.class_code ? (
            <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 text-indigo-400 font-mono text-[10px] px-1.5 py-0.5 border border-indigo-900/40 w-fit">
              {row.class_code}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">Không có lớp</span>
          )}
          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-60" title={row.program_name}>
            {row.program_name ? `${row.program_name} (${row.program_code})` : "Không có ngành"}
          </span>
        </div>
      ),
    },
    {
      header: "Số liệu (Sinh viên / Môn học)",
      render: (row: LogItem) => (
        <span className="text-slate-300 font-semibold text-xs">
          {row.student_count ?? 0} sinh viên / {row.course_count ?? 0} môn học
        </span>
      ),
    },
    {
      header: "Kết quả kiểm định",
      render: (row: LogItem) => (
        <div className="text-xs">
          <span className="text-emerald-400 font-bold font-mono">
            {row.success_count ?? 0} Hợp lệ{" "}
          </span>
          <span className="text-amber-400 font-bold font-mono">
            / {row.warning_count ?? 0} Cảnh báo
          </span>
        </div>
      ),
    },
    {
      header: "Thao tác",
      render: (row: LogItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Chỉnh sửa"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {!activeFilters?.program_id ? (
        /* Selection Screen */
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[65vh]">
          <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
            {/* Glow effect */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <History className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-6 text-xl font-extrabold text-white! tracking-tight">Lịch sử xuất dữ liệu</h2>
              <p className="mt-2 text-xs text-slate-400">
                Vui lòng chọn Ngành và Chương trình đào tạo để xem nhật ký xuất dữ liệu.
              </p>
            </div>

            {loadingMetadata ? (
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
                  Truy cập Nhật ký
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
            <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Lịch sử xuất dữ liệu</h1>
            <p className="text-xs text-slate-400">
              Kiểm tra các dòng cơ sở dữ liệu xuất bản ghi theo dõi sinh viên được xử lý, số lượng đề cương và cờ cảnh báo ma trận.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <History size={22} />
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
                  Đang hiển thị danh sách nhật ký xuất thuộc chương trình đã chọn.
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

          {error && (
            <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
              {error}
            </div>
          )}

          {/* Data Table */}
          <DataTable<LogItem>
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
            searchPlaceholder="Tìm kiếm nhật ký xuất..."
            filters={
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider pr-1">
                  <Filter size={12} className="text-indigo-400" />
                  <span>Bộ lọc:</span>
                </div>

                {/* Class Filter */}
                <select
                  value={(activeFilters?.class_id as string) || ""}
                  onChange={(e) => updateFilters({ class_id: e.target.value || undefined })}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <option className="bg-slate-900 text-slate-400" value="">Tất cả lớp học</option>
                  {classesList
                    .filter((c) => c.program_id === activeFilters.program_id)
                    .map((c) => (
                      <option className="bg-slate-900 text-slate-200" key={c.id} value={c.id}>
                        {c.class_code} {c.class_name ? `(${c.class_name})` : ""}
                      </option>
                    ))}
                </select>

                {/* Clear Filters Button */}
                {(search || !!activeFilters?.class_id) && (
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
                Thêm nhật ký xuất
              </button>
            }
          />
        </div>
      )}

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa nhật ký xuất kiểm định" : "Tạo nhật ký xuất kiểm định mới"}
        size="lg"
      >
        <ExportLogForm
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
        title="Xóa nhật ký xuất kiểm định"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn nhật ký xuất này?\n\nHành động này không thể hoàn tác.${deleteError ? `\n\n⚠ ${deleteError}` : ""}`}
        confirmText="Xóa vĩnh viễn"
        isDanger
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
