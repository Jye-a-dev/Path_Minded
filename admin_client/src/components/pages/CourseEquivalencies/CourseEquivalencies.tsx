import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { CourseEquivalencyForm } from "./CourseEquivalencyForm";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";

interface EquivalencyItem {
  id: string;
  program_id: string;
  original_course_code: string;
  equivalent_course_code: string;
  note?: string;
}

export default function CourseEquivalencies() {
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
  } = usePaginatedApi<EquivalencyItem>("/course_equivalencies");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquivalencyItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: EquivalencyItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    program_id: string;
    original_course_code: string;
    equivalent_course_code: string;
    note: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this course equivalency link?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete equivalency");
      }
    }
  };

  const columns = [
    {
      header: "Original Course",
      accessorKey: "original_course_code",
      render: (row: EquivalencyItem) => (
        <span className="font-mono text-xs font-bold text-slate-200">{row.original_course_code}</span>
      ),
    },
    {
      header: "Equivalent Course",
      accessorKey: "equivalent_course_code",
      render: (row: EquivalencyItem) => (
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-emerald-400" />
          <span className="font-mono text-xs font-bold text-emerald-400">{row.equivalent_course_code}</span>
        </div>
      ),
    },
    {
      header: "Custom Note",
      accessorKey: "note",
      render: (row: EquivalencyItem) => (
        <span className="text-slate-400 font-normal whitespace-normal text-xs">{row.note || "N/A"}</span>
      ),
    },
    {
      header: "Program ID",
      accessorKey: "program_id",
      render: (row: EquivalencyItem) => (
        <span className="text-xs text-slate-500 font-mono">{row.program_id}</span>
      ),
    },
    {
      header: "Actions",
      render: (row: EquivalencyItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Course Equivalencies</h1>
          <p className="mt-1 text-xs text-slate-400">
            Define alternative courses that can fulfill the same requirement block.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<EquivalencyItem>
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
        searchPlaceholder="Search original course..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Equivalency
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Course Equivalency" : "Add Course Equivalency Link"}
      >
        <CourseEquivalencyForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
