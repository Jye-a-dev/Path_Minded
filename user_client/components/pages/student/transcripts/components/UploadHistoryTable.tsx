import React from "react";
import { Upload, FileText, Eye, Trash2, Loader2, FileSpreadsheet } from "lucide-react";

export interface ParsedResult {
  schoolYear?: string;
  semesterNumber?: number;
  courseCode?: string;
  courseName?: string;
  credits?: number;
  score10?: number | null;
  score4?: number | null;
  letterGrade?: string | null;
  status?: string;
}

export interface ParsedWarning {
  rowNumber?: number;
  message?: string;
  rawValue?: string;
}

export interface UploadSession {
  id: string;
  student_id: string;
  raw_text: string;
  source_type: "FILE" | "PASTE";
  parse_status: "PENDING" | "SUCCESS" | "FAILED";
  parse_error?: string | null;
  uploaded_at: string;
  parsed_at?: string | null;
  parsed_json?: {
    results?: ParsedResult[];
    warnings?: ParsedWarning[];
  } | null;
}

interface UploadHistoryTableProps {
  uploads: UploadSession[];
  loadingUploads: boolean;
  onSelectUpload: (upload: UploadSession) => void;
  onDeleteSession: (id: string) => void;
}

export function UploadHistoryTable({
  uploads,
  loadingUploads,
  onSelectUpload,
  onDeleteSession,
}: UploadHistoryTableProps) {
  if (loadingUploads) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 text-sm">
        <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
        Đang tải lịch sử...
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
          <FileSpreadsheet size={26} />
        </div>
        <h3 className="text-sm font-bold text-neutral-800">
          Chưa có bảng điểm nào
        </h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
          Nhấn &ldquo;Nhập bảng điểm mới&rdquo; để tải lên hoặc dán dữ
          liệu bảng điểm từ cổng đào tạo.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
            <th className="px-5 py-3.5">Thời gian tải lên</th>
            <th className="px-5 py-3.5">Phương thức</th>
            <th className="px-5 py-3.5">Trạng thái</th>
            <th className="px-5 py-3.5">Lỗi phân tích</th>
            <th className="px-5 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {uploads.map((upload) => (
            <tr
              key={upload.id}
              className="hover:bg-violet-50/30 text-neutral-700 transition-colors"
            >
              <td className="px-5 py-4 font-mono text-neutral-500 text-xs">
                {new Date(upload.uploaded_at).toLocaleString("vi-VN")}
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 uppercase">
                  {upload.source_type === "FILE" ? (
                    <>
                      <Upload size={10} /> Tệp tin
                    </>
                  ) : (
                    <>
                      <FileText size={10} /> Văn bản
                    </>
                  )}
                </span>
              </td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                    upload.parse_status === "SUCCESS"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : upload.parse_status === "FAILED"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}
                >
                  {upload.parse_status === "SUCCESS"
                    ? "✓ Thành công"
                    : upload.parse_status === "FAILED"
                      ? "✗ Thất bại"
                      : "⏳ Đang xử lý"}
                </span>
              </td>
              <td
                className="px-5 py-4 font-mono text-red-500 max-w-50 truncate text-xs"
                title={upload.parse_error || ""}
              >
                {upload.parse_error ?? (
                  <span className="text-zinc-300 font-normal">
                    —
                  </span>
                )}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <button
                    onClick={() => onSelectUpload(upload)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors cursor-pointer"
                    title="Xem chi tiết"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onDeleteSession(upload.id)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer"
                    title="Xóa phiên"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
