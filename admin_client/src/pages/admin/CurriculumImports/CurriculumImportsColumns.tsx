import { type ImportItem, type GroupedImportItem } from "../../../hooks/useCurriculumImports";
import { CheckCircle2, Trash2, XCircle } from "lucide-react";

export const getCurriculumImportsColumns = (
  handleConfirmImport: (row: ImportItem) => void,
  handleRejectImport: (id: string) => Promise<void>,
  handleDelete: (id: string) => Promise<void>,
  onVersionChange?: (fileName: string, id: string) => void
) => [
  {
    header: "Tên tệp / Nguồn",
    accessorKey: "file_name",
    render: (row: GroupedImportItem) => (
      <div>
        <span className="text-slate-200 font-bold block">{row.file_name}</span>
        {row.versions && row.versions.length > 1 && onVersionChange ? (
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-500 font-semibold uppercase">Bản tải lên:</span>
            <select
              value={row.id}
              onChange={(e) => onVersionChange(row.file_name, e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 px-1.5 py-0.5 rounded cursor-pointer focus:outline-none"
            >
              {row.versions.map((v: ImportItem, index: number) => (
                <option key={v.id} value={v.id} className="bg-slate-950 text-slate-300">
                  {new Date(v.uploaded_at).toLocaleString()} {index === 0 ? "(Mới nhất)" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        )}
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
          <>
            <button
              onClick={() => handleConfirmImport(row)}
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2 py-1.5 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 size={12} />
              Duyệt / Đối soát
            </button>
            <button
              onClick={() => handleRejectImport(row.id)}
              className="flex items-center gap-1.5 rounded bg-rose-600 hover:bg-rose-500 px-2 py-1.5 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <XCircle size={12} />
              Từ chối
            </button>
          </>
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
