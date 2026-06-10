import React from "react";
import { History, TableProperties, Loader2, Download, Trash2 } from "lucide-react";
import { ClassItem, ExportLog } from "../index";

interface ExportLogsTableProps {
  exportLogs: ExportLog[];
  classes: ClassItem[];
  downloadingId: string | null;
  handleDownloadExcel: (classId: string, classCode: string) => void;
  setSelectedClassId: (id: string) => void;
  setViewMatrix: (val: boolean) => void;
  setActiveTab: (tab: "matrix" | "history") => void;
  setDeletingLogId: (id: string) => void;
}

export default function ExportLogsTable({
  exportLogs,
  classes,
  downloadingId,
  handleDownloadExcel,
  setSelectedClassId,
  setViewMatrix,
  setActiveTab,
  setDeletingLogId
}: ExportLogsTableProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative z-10">
      <div className="p-5 border-b border-zinc-150 flex items-center justify-between">
        <h3 className="text-md font-bold text-neutral-900 flex items-center gap-1.5">
          <History size={18} className="text-emerald-650" />
          Lịch sử các tệp ma trận đã kết xuất
        </h3>
        <span className="text-[10px] bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded uppercase">
          Tổng số: {exportLogs.length} bản ghi
        </span>
      </div>

      {exportLogs.length === 0 ? (
        <div className="p-16 text-center text-xs text-neutral-455 italic font-semibold">
          Chưa có lịch sử kết xuất nào cho tài khoản cố vấn này.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-450 font-bold text-[9px] uppercase tracking-wider border-b border-zinc-150">
                <th className="px-5 py-3">Chi tiết tệp</th>
                <th className="px-5 py-3">Mã lớp</th>
                <th className="px-5 py-3">Thời gian tạo</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {exportLogs.map((log) => {
                const classObj = classes.find((c) => c.id === log.class_id);
                const classCode = classObj ? classObj.class_code : "N/A";
                return (
                  <tr key={log.id} className="hover:bg-neutral-50/50 text-neutral-700 font-medium">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-neutral-900 block truncate max-w-xs md:max-w-md">
                        {log.file_name || `Matrix_${classCode}.xlsx`}
                      </span>
                      <span className="text-[9px] text-neutral-400 font-mono">ID: {log.id}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-neutral-800">
                      {classCode}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-500">
                      {new Date(log.exported_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {log.class_id && (
                          <button
                            onClick={() => {
                              setSelectedClassId(log.class_id!);
                              setViewMatrix(true);
                              setActiveTab("matrix");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 text-xs font-bold text-neutral-700 transition cursor-pointer"
                            title="Xem ma trận trực tuyến"
                          >
                            <TableProperties size={12} />
                            Xem ma trận
                          </button>
                        )}
                        {log.class_id && (
                          <button
                            onClick={() => handleDownloadExcel(log.class_id!, classCode)}
                            disabled={downloadingId === log.class_id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 disabled:opacity-50 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                            title="Tải lại file Excel"
                          >
                            {downloadingId === log.class_id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            Tải Excel
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingLogId(log.id)}
                          className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa bản ghi lịch sử"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
