import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { PrerequisiteForm } from "./PrerequisiteForm";
import { Plus, Edit2, Trash2, GitFork } from "lucide-react";

interface PrereqItem {
  id: string;
  program_id: string;
  course_code: string;
  prerequisite_course_code: string;
  prerequisite_type: "REQUIRED" | "RECOMMENDED";
}

export default function CoursePrerequisites() {
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
  } = usePaginatedApi<PrereqItem>("/course_prerequisites");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PrereqItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: PrereqItem) => {
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
    if (window.confirm("Are you sure you want to permanently delete this prerequisite relationship?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete prerequisite");
      }
    }
  };

  const columns = [
    {
      header: "Course Code",
      accessorKey: "course_code",
      render: (row: PrereqItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.course_code}</span>
      ),
    },
    {
      header: "Requires Predecessor",
      accessorKey: "prerequisite_course_code",
      render: (row: PrereqItem) => (
        <div className="flex items-center gap-1.5">
          <GitFork size={14} className="text-indigo-400 rotate-180" />
          <span className="font-mono text-xs font-bold text-slate-300">
            {row.prerequisite_course_code}
          </span>
        </div>
      ),
    },
    {
      header: "Requirement Block Type",
      accessorKey: "prerequisite_type",
      render: (row: PrereqItem) => {
        const isRequired = row.prerequisite_type === "REQUIRED";
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${
              isRequired
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {row.prerequisite_type || "REQUIRED"}
          </span>
        );
      },
    },
    {
      header: "Actions",
      render: (row: PrereqItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Course Prerequisites</h1>
          <p className="mt-1 text-xs text-slate-400">
            Define requirements where passing specific predecessor courses is a strict blocker.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<PrereqItem>
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
        searchPlaceholder="Search course code..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Prerequisite
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Course Prerequisite Link" : "Create Course Prerequisite Link"}
        size="lg"
      >
        <PrerequisiteForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
