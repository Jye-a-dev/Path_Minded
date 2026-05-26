import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { ProgramForm } from "./ProgramForm";
import { Plus, Edit2, Trash2, BookOpen } from "lucide-react";

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string;
  version?: string;
  total_credits?: number;
}

export default function Programs() {
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
  } = usePaginatedApi<ProgramItem>("/programs");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null);

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
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this Program?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete program");
      }
    }
  };

  const columns = [
    {
      header: "Program Code",
      accessorKey: "program_code",
      render: (row: ProgramItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-indigo-950/40 text-indigo-400 font-mono text-xs px-2 py-0.5 border border-indigo-900/40">
          <BookOpen size={10} />
          {row.program_code}
        </span>
      ),
    },
    {
      header: "Program Name",
      accessorKey: "program_name",
      render: (row: ProgramItem) => (
        <span className="text-slate-200 font-bold">{row.program_name}</span>
      ),
    },
    {
      header: "Major Name",
      accessorKey: "major_name",
      render: (row: ProgramItem) => (
        <span className="text-slate-400 font-normal">{row.major_name || "N/A"}</span>
      ),
    },
    {
      header: "Version",
      accessorKey: "version",
      render: (row: ProgramItem) => (
        <span className="text-slate-400 font-semibold">{row.version || "N/A"}</span>
      ),
    },
    {
      header: "Credits",
      accessorKey: "total_credits",
      render: (row: ProgramItem) => (
        <span className="text-slate-300 font-semibold">{row.total_credits ?? "N/A"}</span>
      ),
    },
    {
      header: "Actions",
      render: (row: ProgramItem) => (
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Education Programs</h1>
          <p className="mt-1 text-xs text-slate-400">
            Define academic syllabus matrices, degree levels and graduation credit thresholds.
          </p>
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
        searchPlaceholder="Search program code or name..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Program
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Academic Program" : "Create Academic Program"}
      >
        <ProgramForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
