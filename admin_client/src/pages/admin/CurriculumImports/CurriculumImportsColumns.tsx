import { type ImportItem } from "../../../hooks/useCurriculumImports";
import { CheckCircle2, Trash2 } from "lucide-react";

export const getCurriculumImportsColumns = (
  handleConfirmImport: () => void,
  handleDelete: (id: string) => Promise<void>
) => [
  {
    header: "Tên tệp / Nguồn",
    accessorKey: "file_name",
    render: (row: ImportItem) => (
      <div>
        <span className="text-slate-200 font-bold block">{row.file_name}</span>
        <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
      </div>
    ),
  },
  {
    header: "Trạng thái",
    accessorKey: "import_status",
    render: (row: ImportItem) => {
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
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.import_status]}`}
        >
          {statusMap[row.import_status]}
        </span>
      );
    },
  },
  {
    header: "Thời gian Tải lên / Xử lý",
    render: (row: ImportItem) => (
      <div className="text-xs text-slate-400 font-mono">
        <div>Tải lên: {new Date(row.uploaded_at).toLocaleString()}</div>
        {row.processed_at && (
          <div className="text-emerald-500">Xử lý: {new Date(row.processed_at).toLocaleString()}</div>
        )}
      </div>
    ),
  },
  {
    header: "Nhật ký lỗi",
    accessorKey: "import_error",
    render: (row: ImportItem) => (
      <span className="text-xs text-rose-400 font-mono max-w-50 truncate block" title={row.import_error}>
        {row.import_error || "Không có"}
      </span>
    ),
  },
  {
    header: "Thao tác",
    render: (row: ImportItem) => (
      <div className="flex items-center gap-2">
        {row.import_status === "PENDING" && (
          <button
            onClick={() => handleConfirmImport()}
            className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1 text-xs font-bold text-white shadow-lg transition cursor-pointer"
          >
            <CheckCircle2 size={12} />
            Xác nhận
          </button>
        )}
        <button
          onClick={() => handleDelete(row.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ),
  },
];
