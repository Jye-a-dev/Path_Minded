import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ClassForm } from "./ClassForm";
import { Plus, Edit2, Trash2, Building2 } from "lucide-react";

interface ClassItem {
  id: string;
  class_code: string;
  class_name?: string;
  cohort_year?: number;
  advisor_id?: string;
  program_id?: string;
  advisor_name?: string;
  program_code?: string;
}

export default function Classes() {
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
    createItem,
    updateItem,
    deleteItem,
  } = usePaginatedApi<ClassItem>("/classes");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);

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
    if (window.confirm("Are you sure you want to permanently delete this Class?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete class");
      }
    }
  };

  const columns = [
    {
      header: "Class Code",
      accessorKey: "class_code",
      render: (row: ClassItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 text-indigo-400 font-mono text-xs px-2 py-0.5 border border-indigo-900/40">
          <Building2 size={10} />
          {row.class_code}
        </span>
      ),
    },
    {
      header: "Class Name",
      accessorKey: "class_name",
      render: (row: ClassItem) => (
        <span className="text-slate-200 font-bold">{row.class_name || "N/A"}</span>
      ),
    },
    {
      header: "Cohort Year",
      accessorKey: "cohort_year",
      render: (row: ClassItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Advisor Code",
      accessorKey: "advisor_id",
      render: (row: ClassItem) => (
        <span className="text-xs text-slate-400 font-normal">
          {row.advisor_id || "None Assigned"}
        </span>
      ),
    },
    {
      header: "Program Code",
      accessorKey: "program_id",
      render: (row: ClassItem) => (
        <span className="text-xs text-slate-400 font-normal">
          {row.program_id || "None Assigned"}
        </span>
      ),
    },
    {
      header: "Actions",
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Student Classes</h1>
          <p className="mt-1 text-xs text-slate-400">
            Organize study groups by cohort year and link them to educational curricula and advisors.
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
        searchPlaceholder="Search class code or name..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Class
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Class Setup" : "Create Study Class"}
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
