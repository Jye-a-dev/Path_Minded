import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useClassImportRows } from "../../../hooks/useClassImportRows";
import type { ClassImportRowItem as RowItem } from "../../../hooks/useClassImportRows";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2, X, Mail, ListOrdered, ChevronLeft, Loader2 } from "lucide-react";
import { ClassImportRowForm } from "./ClassImportRowForm";
import { api } from "../../../services/api";

export default function ClassImportRows() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get("email");

  // ── Config state ──────────────────────────────────────────────────────────
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [allPrograms, setAllPrograms] = useState<
    { id: string; program_code: string; program_name: string; major_name?: string | null }[]
  >([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [classesForMajor, setClassesForMajor] = useState<{ id: string; class_code: string; program_id?: string }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // ── Hook ──────────────────────────────────────────────────────────────────
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
    updateFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useClassImportRows();

  // ── Load programs ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  // ── Load classes when major changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedMajor || allPrograms.length === 0) return;
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<{ id: string; class_code: string; program_id?: string }[]>(
            `/classes?limit=100&program_id=${p.id}`
          )
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesForMajor(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    void fetchClasses();
  }, [selectedMajor, allPrograms]);

  // ── Apply class_id filter ─────────────────────────────────────────────────
  useEffect(() => {
    if (isConfigured && selectedClassId) {
      updateFilters({ class_id: selectedClassId });
    } else {
      updateFilters({ class_id: undefined });
    }
  }, [isConfigured, selectedClassId, updateFilters]);

  // ── Pre-fill search with email from URL param ─────────────────────────────
  useEffect(() => {
    if (emailParam) {
      setSearch(emailParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RowItem | null>(null);

  const handleOpenCreate = () => { setEditingItem(null); setModalOpen(true); };
  const handleOpenEdit   = (item: RowItem) => { setEditingItem(item); setModalOpen(true); };
  const handleCloseModal = () => setModalOpen(false);

  const handleSubmit = async (payload: {
    import_id: string;
    row_number: number | null;
    student_code: string | null;
    full_name: string | null;
    email: string | null;
    row_status: "PENDING" | "SUCCESS" | "FAILED";
    row_error: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn hàng nhập này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa hàng nhập thất bại");
      }
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Dòng số",
      accessorKey: "row_number",
      render: (row: RowItem) => (
        <span className="font-mono text-xs font-semibold text-slate-400">
          #{row.row_number ?? "N/A"}
        </span>
      ),
    },
    {
      header: "Chi tiết sinh viên",
      render: (row: RowItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-200 block">{row.student_code || "N/A"}</span>
          <span className="text-xs text-slate-400 font-semibold block">{row.full_name || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Lớp học",
      accessorKey: "class_code",
      render: (row: RowItem) => (
        <span className="text-slate-300 font-semibold text-xs">{row.class_code || "N/A"}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      render: (row: RowItem) => (
        <span className="text-slate-400 font-normal text-xs">{row.email || "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "row_status",
      render: (row: RowItem) => {
        const badges = {
          PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = {
          PENDING: "CHỜ XỬ LÝ",
          SUCCESS: "THÀNH CÔNG",
          FAILED: "THẤT BẠI",
        };
        return (
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.row_status]}`}>
            {statusMap[row.row_status]}
          </span>
        );
      },
    },
    {
      header: "Nhật ký lỗi",
      accessorKey: "row_error",
      render: (row: RowItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block" title={row.row_error}>
          {row.row_error || "Không có"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: RowItem) => (
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

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    const selectedClassName = classesForMajor.find((c) => c.id === selectedClassId)?.class_code ?? "";

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
            <ListOrdered className="text-indigo-400! h-8 w-8" />
            Chi tiết hàng nhập lớp
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành và lớp học mục tiêu.
          </p>
        </div>

        {loadingPrograms ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            Đang tải dữ liệu cấu hình hệ thống...
          </div>
        ) : (
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur-md space-y-6">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl" />

            <div className="space-y-4">
              {/* Major Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chuyên ngành
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMajor(val);
                    setSelectedClassId("");
                    if (!val) setClassesForMajor([]);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                >
                  <option className="bg-slate-900 text-slate-500" value="">-- Chọn chuyên ngành --</option>
                  {uniqueMajors.map((major) => (
                    <option className="bg-slate-900 text-slate-100" key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Lớp học
                </label>
                {loadingClasses ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách lớp...
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    disabled={!selectedMajor || classesForMajor.length === 0}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-500" value="">
                      {!selectedMajor
                        ? "-- Vui lòng chọn chuyên ngành trước --"
                        : classesForMajor.length === 0
                        ? "-- Không tìm thấy lớp học nào --"
                        : "-- Chọn lớp học --"}
                    </option>
                    {classesForMajor.map((c) => (
                      <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                        {c.class_code}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Preview badge */}
            {selectedClassId && selectedClassName && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2 text-xs text-teal-300">
                <span className="font-bold">Lớp đã chọn:</span>
                <span className="font-mono font-semibold text-teal-200">{selectedClassName}</span>
              </div>
            )}

            <button
              onClick={() => { if (selectedClassId) setIsConfigured(true); }}
              disabled={!selectedClassId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer hover:-translate-y-0.5"
            >
              Vào trang quản lý
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  const selectedClassName = classesForMajor.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfigured(false);
              setSelectedClassId("");
              updateFilters({ class_id: undefined });
            }}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Chi tiết hàng nhập lớp</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                {selectedClassName}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Kiểm tra từng dòng hồ sơ trong các tệp CSV nhập sinh viên lớp học.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Email filter banner */}
      {emailParam && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5">
          <Mail size={14} className="text-indigo-400 shrink-0" />
          <span className="text-xs text-indigo-300">
            Đang lọc theo email: <span className="font-mono font-bold text-indigo-200">{emailParam}</span>
          </span>
          <button
            onClick={() => {
              setSearch("");
              navigate("/admin/class_import_rows", { replace: true });
            }}
            className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-xs text-indigo-400 hover:bg-indigo-500/20 hover:text-white transition-colors cursor-pointer"
          >
            <X size={12} /> Xóa bộ lọc
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable<RowItem>
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
        searchPlaceholder="Tìm kiếm mã sinh viên, tên hoặc email..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tạo dòng
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa dòng hồ sơ nhập" : "Tạo dòng hồ sơ nhập mới"}
        size="lg"
      >
        <ClassImportRowForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
