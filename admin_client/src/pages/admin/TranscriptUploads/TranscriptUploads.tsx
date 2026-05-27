import { useState } from "react";
import { useTranscriptUploads } from "../../../hooks/useTranscriptUploads";
import type { UploadItem } from "../../../hooks/useTranscriptUploads";
import { DataTable } from "../../../components/data-display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Trash2 } from "lucide-react";
import { TranscriptUploadForm } from "./TranscriptUploadForm";

export default function TranscriptUploads() {
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
    createUpload,
  } = useTranscriptUploads();

  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: { student_id: string; textContent: string }) => {
    await createUpload(payload);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phiên tải lên bảng điểm này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa phiên tải lên thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Phiên tải lên",
      render: (row: UploadItem) => (
        <div>
          <span className="text-slate-200 font-bold block">Phiên bảng điểm</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Loại nguồn",
      accessorKey: "source_type",
      render: (row: UploadItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase tracking-wide">
          {row.source_type}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "parse_status",
      render: (row: UploadItem) => {
        const badges = {
          PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = {
          PENDING: "CHỜ XỬ LÝ",
          SUCCESS: "THÀNH CÔNG",
          FAILED: "THẤT BẠI",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.parse_status]}`}
          >
            {statusMap[row.parse_status]}
          </span>
        );
      },
    },
    {
      header: "Thời gian Tải lên / Phân tích",
      render: (row: UploadItem) => (
        <div className="text-xs text-slate-400 font-mono">
          <div>Tải lên: {new Date(row.uploaded_at).toLocaleString()}</div>
          {row.parsed_at && (
            <div className="text-emerald-500">Phân tích: {new Date(row.parsed_at).toLocaleString()}</div>
          )}
        </div>
      ),
    },
    {
      header: "Nhật ký lỗi",
      accessorKey: "parse_error",
      render: (row: UploadItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block font-normal" title={row.parse_error}>
          {row.parse_error || "Không có"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: UploadItem) => (
        <div className="flex items-center gap-2">
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Tải bảng điểm lên</h1>
          <p className="mt-1 text-xs text-slate-400">
            Nhập bảng điểm thô của sinh viên, phân tích điểm và tự động tính toán điểm số ma trận học tập.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<UploadItem>
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
        searchPlaceholder="Tìm kiếm phiên tải lên bảng điểm..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tải bảng điểm
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Nhập tệp bảng điểm sinh viên"
        size="lg"
      >
        <TranscriptUploadForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
