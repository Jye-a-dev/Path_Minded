import { useState, useEffect } from "react";
import { useStudents } from "../../../hooks/useStudents";
import type { StudentItem } from "../../../hooks/useStudents";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { StudentForm } from "./StudentForm";
import { Plus, Edit2, Trash2, GraduationCap, ChevronLeft } from "lucide-react";
import { api } from "../../../services/api";
import { useColumnLabels } from "../../../hooks/useColumnLabels";
import { useClassLookup } from "../../../hooks/useClassLookup";
import { useSearchParams } from "react-router-dom";
import { StudentsConfigCard } from "./components/StudentsConfigCard";
import { DeleteAllModal } from "./components/DeleteAllModal";

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
      Promise.resolve().then(() => {
        setSelectedMajor(major);
        setSelectedClassId(classId);
        setIsConfigured(true);
        if (searchVal) {
          setSearch(searchVal);
        }
      });
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
    return (
      <StudentsConfigCard
        loadingPrograms={loadingPrograms}
        allPrograms={allPrograms}
        selectedMajor={selectedMajor}
        setSelectedMajor={setSelectedMajor}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        loadingClasses={loadingClasses}
        classesForMajor={classesForMajor}
        setClassesForMajor={setClassesForMajor}
        setIsConfigured={setIsConfigured}
      />
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
              <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Quản lý Sinh viên</h1>
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
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-50/20 hover:border-rose-505 hover:text-rose-300 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
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
      <DeleteAllModal
        isOpen={deleteAllOpen}
        onClose={() => !deleteAllLoading && setDeleteAllOpen(false)}
        total={total}
        deleteAllLoading={deleteAllLoading}
        deleteAllError={deleteAllError}
        onConfirm={handleDeleteAll}
      />

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
