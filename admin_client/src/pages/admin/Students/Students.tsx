import { useState, useEffect } from "react";
import { useStudents } from "../../../hooks/useStudents";
import type { StudentItem } from "../../../hooks/useStudents";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { StudentForm } from "./StudentForm";
import { Plus, Edit2, Trash2, GraduationCap, Loader2, ChevronLeft, FolderInput } from "lucide-react";
import { api } from "../../../services/api";
import { useColumnLabels } from "../../../hooks/useColumnLabels";
import { useClassLookup } from "../../../hooks/useClassLookup";
import { useSearchParams } from "react-router-dom";

export default function Students() {
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
    refresh,
  } = useStudents();

  const [searchParams] = useSearchParams();
  const queryClassId = searchParams.get("class_id") || "";
  const queryMajor = searchParams.get("major") || "";
  const initialConfigured = !!(queryClassId && queryMajor);

  const [selectedMajor, setSelectedMajor] = useState<string>(queryMajor);
  const [selectedClassId, setSelectedClassId] = useState<string>(queryClassId);
  const [isConfigured, setIsConfigured] = useState<boolean>(initialConfigured);

  useEffect(() => {
    const classId = searchParams.get("class_id");
    const major = searchParams.get("major");
    const searchVal = searchParams.get("search");

    if (classId && major) {
      setSelectedMajor(major);
      setSelectedClassId(classId);
      setIsConfigured(true);
      if (searchVal) {
        setSearch(searchVal);
      }
    }
  }, [searchParams, setSearch]);
  
  const [allPrograms, setAllPrograms] = useState<{ id: string; program_code: string; program_name: string; major_name?: string | null }[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [classesForMajor, setClassesForMajor] = useState<{ id: string; class_code: string; program_id?: string }[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  // Single delete state
  const [deleteTarget, setDeleteTarget] = useState<StudentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { getLabel } = useColumnLabels("CLASS");
  const { getClassName } = useClassLookup();

  const getProgramCode = (programId?: string) => {
    if (!programId) return "Chưa chỉ định";
    const found = allPrograms.find((p) => p.id === programId);
    return found ? `${found.program_name} (${found.program_code})` : "N/A";
  };

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

  useEffect(() => {
    if (!selectedMajor || allPrograms.length === 0) return;
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<{ id: string; class_code: string; program_id?: string }[]>(`/classes?limit=100&program_id=${p.id}`)
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

  useEffect(() => {
    if (isConfigured && selectedClassId) {
      updateFilters({ class_id: selectedClassId });
    } else {
      updateFilters({ class_id: undefined });
    }
  }, [isConfigured, selectedClassId, updateFilters]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    student_code: string;
    full_name: string;
    cohort_year: number | null;
    status: "ACTIVE" | "GRADUATED" | "DROPPED";
    user_id: string | null;
    class_id: string | null;
    program_id: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa sinh viên thất bại");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    setDeleteAllError(null);
    try {
      await api.delete("/students");
      setDeleteAllOpen(false);
      await refresh();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setDeleteAllError(errObj.response?.data?.message || errObj.message || "Xóa tất cả sinh viên thất bại.");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const columns = [
    {
      header: getLabel("student_code", "Mã số"),
      accessorKey: "student_code",
      render: (row: StudentItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.student_code}</span>
      ),
    },
    {
      header: getLabel("full_name", "Họ và tên"),
      accessorKey: "full_name",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-emerald-400" />
          <span className="text-slate-200 font-bold">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: getLabel("email", "Email"),
      accessorKey: "email",
      render: (row: StudentItem) =>
        row.email ? (
          <span className="text-xs font-mono text-slate-300">{row.email}</span>
        ) : (
          <span className="text-xs text-slate-500 italic">Chưa liên kết</span>
        ),
    },
    {
      header: "Khóa",
      accessorKey: "cohort_year",
      render: (row: StudentItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      render: (row: StudentItem) => {
        const statuses = {
          ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          GRADUATED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          DROPPED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = {
          ACTIVE: "ĐANG HỌC",
          GRADUATED: "TỐT NGHIỆP",
          DROPPED: "THÔI HỌC",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border ${statuses[row.status]}`}
          >
            {statusMap[row.status]}
          </span>
        );
      },
    },
    {
      header: "Lớp học",
      accessorKey: "class_id",
      render: (row: StudentItem) => (
        <span className="text-xs font-medium text-slate-300">{getClassName(row.class_id)}</span>
      ),
    },
    {
      header: "Chương trình đào tạo",
      accessorKey: "program_id",
      render: (row: StudentItem) => (
        <span className="text-xs text-slate-400">{getProgramCode(row.program_id)}</span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
            title="Xóa hồ sơ sinh viên"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <FolderInput className="text-indigo-400! h-8 w-8" />
            Quản lý Sinh viên
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
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>

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
                    if (!val) {
                      setClassesForMajor([]);
                    }
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

            <button
              onClick={() => {
                if (selectedClassId) {
                  setIsConfigured(true);
                }
              }}
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

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfigured(false);
              setSelectedClassId("");
            }}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Quản lý Sinh viên</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                {getClassName(selectedClassId)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Đang làm việc với lớp học: <span className="text-slate-200 font-semibold">{getClassName(selectedClassId)}</span> thuộc chuyên ngành <span className="text-slate-200 font-semibold">{selectedMajor}</span>.
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
      <DataTable<StudentItem>
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
        searchPlaceholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
        filters={
          <select
            value={(filters.status as string) || ""}
            onChange={(e) => updateFilters({ status: e.target.value || undefined })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option className="bg-slate-900 text-slate-100" value="">Tất cả trạng thái</option>
            <option className="bg-slate-900 text-slate-100" value="ACTIVE">ĐANG HỌC</option>
            <option className="bg-slate-900 text-slate-100" value="GRADUATED">TỐT NGHIỆP</option>
            <option className="bg-slate-900 text-slate-100" value="DROPPED">THÔI HỌC</option>
          </select>
        }
        rightActions={
          <>
            <button
              onClick={() => { setDeleteAllError(null); setDeleteAllOpen(true); }}
              disabled={total === 0 || loading}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              Xóa tất cả
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo sinh viên
            </button>
          </>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa cấu hình Sinh viên" : "Đăng ký hồ sơ Sinh viên"}
        size="lg"
      >
        <StudentForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          defaultClassId={selectedClassId}
          defaultProgramId={classesForMajor.find((c) => c.id === selectedClassId)?.program_id}
        />
      </Modal>

      {/* Delete All Confirmation Modal */}
      <Modal
        isOpen={deleteAllOpen}
        onClose={() => !deleteAllLoading && setDeleteAllOpen(false)}
        title="Xác nhận xóa tất cả sinh viên"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-4">
            <p className="text-sm font-semibold text-rose-300">
              ⚠️ Hành động này <span className="font-black underline">không thể hoàn tác</span>.
            </p>
            <p className="mt-1.5 text-xs text-rose-400/80">
              Toàn bộ <span className="font-bold text-rose-300">{total.toLocaleString()} sinh viên</span> trong cơ sở dữ liệu sẽ bị xóa vĩnh viễn, bao gồm tất cả dữ liệu liên kết.
            </p>
          </div>

          {deleteAllError && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {deleteAllError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteAllOpen(false)}
              disabled={deleteAllLoading}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllLoading}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-60 disabled:pointer-events-none transition-all cursor-pointer"
            >
              {deleteAllLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Xóa tất cả {total.toLocaleString()} sinh viên
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Xác nhận xóa hồ sơ sinh viên"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ sinh viên "${deleteTarget?.full_name}" (MSSV: ${deleteTarget?.student_code}) khỏi hệ thống?\n\nHành động này không thể hoàn tác.`}
        confirmText={deleteLoading ? "Đang xóa..." : "Xóa sinh viên"}
        isDanger={true}
        onConfirm={handleDeleteSingle}
      />
    </div>
  );
}
