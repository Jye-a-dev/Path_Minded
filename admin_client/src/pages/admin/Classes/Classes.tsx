import { useState, useEffect } from "react";
import { useClasses } from "../../../hooks/useClasses";
import type { ClassItem } from "../../../hooks/useClasses";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ClassForm } from "./ClassForm";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";
import { api } from "../../../services/api";

export default function Classes() {
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
  } = useClasses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);

  const [programsList, setProgramsList] = useState<{ id: string; program_name: string; program_code: string }[]>([]);
  const [advisorsList, setAdvisorsList] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [programsRes, advisorsRes] = await Promise.all([
          api.get("/programs?limit=250"),
          api.get("/advisors?limit=100"),
        ]);
        setProgramsList(programsRes.data || []);
        setAdvisorsList(advisorsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch filter metadata:", err);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Lớp học Sinh viên</h1>
          <p className="mt-1 text-xs text-slate-400">
            Tổ chức các nhóm học tập theo niên khóa và liên kết chúng với cố vấn học tập và khung chương trình đào tạo.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
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
            {/* Program Filter */}
            <select
              value={(filters?.program_id as string) || ""}
              onChange={(e) => updateFilters({ program_id: e.target.value || undefined })}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-45"
            >
              <option className="bg-slate-900 text-slate-400" value="">Tất cả chương trình</option>
              {programsList.map((p) => (
                <option className="bg-slate-900 text-slate-200" key={p.id} value={p.id}>
                  {p.program_name} ({p.program_code})
                </option>
              ))}
            </select>

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

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa cấu hình Lớp học" : "Tạo Lớp học mới"}
      >
        <ClassForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
