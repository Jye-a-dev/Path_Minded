import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { Plus, DownloadCloud, Trash2 } from "lucide-react";
import { ExportForm } from "./ExportForm";

interface ExportItem {
  id: string;
  advisor_id?: string;
  class_id: string;
  program_id?: string;
  file_name: string;
  file_path?: string;
  export_type: "MATRIX";
  created_at: string;
}

export default function Exports() {
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
    deleteItem,
    refresh,
  } = usePaginatedApi<ExportItem>("/exports");

  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    class_id: string;
    program_id: string | null;
    advisor_id: string | null;
  }) => {
    const fullPayload = {
      export_type: "MATRIX",
      ...payload,
    };
    await api.post("/exports", fullPayload);
    refresh();
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this export record?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete export");
      }
    }
  };

  const columns = [
    {
      header: "File Details",
      render: (row: ExportItem) => (
        <div>
          <span className="text-slate-200 font-bold block">{row.file_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Export Type",
      accessorKey: "export_type",
      render: (row: ExportItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase tracking-wide">
          {row.export_type}
        </span>
      ),
    },
    {
      header: "Created At",
      accessorKey: "created_at",
      render: (row: ExportItem) => (
        <span className="text-xs text-slate-450 font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Download Path",
      accessorKey: "file_path",
      render: (row: ExportItem) => (
        <span className="text-xs text-slate-400 font-mono max-w-62.5 truncate block" title={row.file_path}>
          {row.file_path || "Processing..."}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row: ExportItem) => (
        <div className="flex items-center gap-2">
          {row.file_path && (
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition"
            >
              <DownloadCloud size={12} />
              Fetch File
            </a>
          )}
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Matrix Exports</h1>
          <p className="mt-1 text-xs text-slate-400">
            Export academic audit matrix spreadsheets to inspect study progress by cohort and class.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ExportItem>
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
        searchPlaceholder="Search export filename..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Export Matrix
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Run Matrix SpreadSheet Export Process"
        size="lg"
      >
        <ExportForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
