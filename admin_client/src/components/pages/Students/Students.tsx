import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { StudentForm } from "./StudentForm";
import { Plus, Edit2, Trash2, GraduationCap } from "lucide-react";

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  cohort_year?: number;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id?: string;
  class_id?: string;
  program_id?: string;
  class_code?: string;
  program_code?: string;
}

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
  } = usePaginatedApi<StudentItem>("/students");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);

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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this Student record?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete student");
      }
    }
  };

  const columns = [
    {
      header: "Code",
      accessorKey: "student_code",
      render: (row: StudentItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.student_code}</span>
      ),
    },
    {
      header: "Full Name",
      accessorKey: "full_name",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-emerald-400" />
          <span className="text-slate-200 font-bold">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: "Cohort",
      accessorKey: "cohort_year",
      render: (row: StudentItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      render: (row: StudentItem) => {
        const statuses = {
          ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          GRADUATED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          DROPPED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border ${statuses[row.status]}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Class Code",
      accessorKey: "class_id",
      render: (row: StudentItem) => (
        <span className="text-xs text-slate-400">{row.class_id || "Unassigned"}</span>
      ),
    },
    {
      header: "Program Code",
      accessorKey: "program_id",
      render: (row: StudentItem) => (
        <span className="text-xs text-slate-400">{row.program_id || "Unassigned"}</span>
      ),
    },
    {
      header: "Actions",
      render: (row: StudentItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Student Directory</h1>
          <p className="mt-1 text-xs text-slate-400">
            CRUD student database rows, map cohort programs, and link them to system user accounts.
          </p>
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
        searchPlaceholder="Search student code or name..."
        filters={
          <select
            value={(filters.status as string) || ""}
            onChange={(e) => updateFilters({ status: e.target.value || undefined })}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="GRADUATED">GRADUATED</option>
            <option value="DROPPED">DROPPED</option>
          </select>
        }
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Student
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Student Setup" : "Register Student Record"}
        size="lg"
      >
        <StudentForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
