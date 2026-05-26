import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { Plus, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { ClassImportForm } from "./ClassImportForm";

interface ImportItem {
  id: string;
  advisor_id?: string;
  class_id: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string;
  uploaded_at: string;
  processed_at?: string;
}

export default function ClassImports() {
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
  } = usePaginatedApi<ImportItem>("/class_imports");

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: { class_id: string; textContent: string }) => {
    const fullPayload = {
      sourceType: "text",
      file_name: `pasted_class_import_${Date.now()}.csv`,
      ...payload,
    };
    await api.post("/class_imports", fullPayload);
    refresh();
    setModalOpen(false);
  };

  const handleConfirmImport = async (id: string) => {
    setConfirmingId(id);
    try {
      await api.post(`/class_imports/${id}/confirm`, {});
      alert("Class student list import confirmed and processed successfully!");
      refresh();
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      alert(errObj.response?.data?.message || errObj.message || "Failed to confirm import.");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this class import session?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete session");
      }
    }
  };

  const columns = [
    {
      header: "Session Details",
      render: (row: ImportItem) => (
        <div>
          <span className="text-slate-200 font-bold block">{row.file_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "import_status",
      render: (row: ImportItem) => {
        const badges = {
          PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.import_status]}`}
          >
            {row.import_status}
          </span>
        );
      },
    },
    {
      header: "Uploaded / Processed",
      render: (row: ImportItem) => (
        <div className="text-xs text-slate-400 font-mono">
          <div>Up: {new Date(row.uploaded_at).toLocaleString()}</div>
          {row.processed_at && (
            <div className="text-emerald-500">Proc: {new Date(row.processed_at).toLocaleString()}</div>
          )}
        </div>
      ),
    },
    {
      header: "Error log",
      accessorKey: "import_error",
      render: (row: ImportItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block" title={row.import_error}>
          {row.import_error || "None"}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (row: ImportItem) => (
        <div className="flex items-center gap-2">
          {row.import_status === "PENDING" && (
            <button
              onClick={() => handleConfirmImport(row.id)}
              disabled={confirmingId !== null}
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg disabled:opacity-50 transition cursor-pointer"
            >
              {confirmingId === row.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Confirm
            </button>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Class Imports</h1>
          <p className="mt-1 text-xs text-slate-400">
            Ingest study groups batches, register new student directories by class sheets.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ImportItem>
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
        searchPlaceholder="Search class session..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            New Import Session
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Start Class Student Import Session"
        size="lg"
      >
        <ClassImportForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
