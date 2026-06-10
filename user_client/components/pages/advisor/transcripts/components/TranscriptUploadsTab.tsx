import React, { useState, useMemo } from "react";
import { Search, Plus, Loader2, FileSpreadsheet, Eye, Trash2 } from "lucide-react";
import { UploadSession } from "../index";

interface TranscriptUploadsTabProps {
  uploads: UploadSession[];
  loadingUploadsTab: boolean;
  onViewDetail: (row: UploadSession) => void;
  onDeleteUpload: (id: string) => void;
  onNewUpload: () => void;
}

export default function TranscriptUploadsTab({
  uploads,
  loadingUploadsTab,
  onViewDetail,
  onDeleteUpload,
  onNewUpload
}: TranscriptUploadsTabProps) {
  const [uploadsSearch, setUploadsSearch] = useState("");

  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      const query = uploadsSearch.toLowerCase().trim();
      if (!query) return true;
      return u.id.toLowerCase().includes(query) || (u.parse_error || "").toLowerCase().includes(query);
    });
  }, [uploads, uploadsSearch]);

  return (
    <div className="space-y-4 relative z-10">
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-455" />
          <input
            type="text"
            placeholder="Lọc phiên tải lên..."
            value={uploadsSearch}
            onChange={(e) => setUploadsSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
          />
        </div>

        <button
          onClick={onNewUpload}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 cursor-pointer shrink-0"
        >
          <Plus size={12} />
          Tải bảng điểm mới
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loadingUploadsTab ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 text-xs">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            Đang tải lịch sử phiên...
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <FileSpreadsheet size={26} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy phiên nào</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Chưa có phiên tải lên bảng điểm nào của sinh viên này được lưu trong hệ thống.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-450 border-b border-zinc-200 font-bold text-[9px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Phiên tải lên</th>
                  <th className="px-5 py-3.5">Nguồn dữ liệu</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Cảnh báo lỗi</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-neutral-700 font-medium">
                {filteredUploads.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/20">
                    <td className="px-5 py-3.5">
                      <span className="text-neutral-900 block font-bold truncate max-w-xs font-mono">{row.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600 border border-zinc-200 uppercase tracking-wide">
                        {row.source_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold border uppercase tracking-wide ${
                        row.parse_status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                        row.parse_status === "FAILED" ? "bg-red-50 text-red-700 border-red-150" : "bg-amber-50 text-amber-600 border-amber-150"
                      }`}>
                        {row.parse_status === "SUCCESS" ? "THÀNH CÔNG" : row.parse_status === "FAILED" ? "THẤT BẠI" : "CHỜ XỬ LÝ"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-500 text-[10px]">
                      Tải lên: {new Date(row.uploaded_at).toLocaleString("vi-VN")}
                      {row.parsed_at && (
                        <div className="text-emerald-700 font-bold mt-0.5">
                          Xử lý: {new Date(row.parsed_at).toLocaleString("vi-VN")}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-red-500 max-w-xs truncate text-[10px]" title={row.parse_error || ""}>
                      {row.parse_error || <span className="text-neutral-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => onViewDetail(row)}
                          className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                          title="Xem chi tiết phiên"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteUpload(row.id)}
                          className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-red-200 hover:text-rose-600 transition cursor-pointer"
                          title="Xóa phiên tải lên"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
