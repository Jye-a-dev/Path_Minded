import { useState } from "react";
import { useTranscriptUploads } from "../../../../hooks/useTranscriptUploads";
import type { UploadItem } from "../../../../hooks/useTranscriptUploads";
import { DataTable } from "../../../../components/data_display/DataTable";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { TranscriptUploadForm } from "../../TranscriptUploads/TranscriptUploadForm";
import {
  Plus,
  Eye,
  Trash2
} from "lucide-react";

interface TranscriptUploadsTabProps {
  studentId: string;
  studentLabel: string;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

interface ParsedResultItem {
  courseCode: string;
  courseName?: string;
  credits?: number;
  schoolYear?: string;
  semesterNumber?: number;
  score10?: number;
  score4?: number;
  letterGrade?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
}

export function TranscriptUploadsTab({
  studentId,
  studentLabel,
  onUploadSuccess,
  onDeleteSuccess
}: TranscriptUploadsTabProps) {
  const transcriptUploadsHook = useTranscriptUploads(studentId);

  // Modals / Details states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadItem, setSelectedUploadItem] = useState<UploadItem | null>(null);
  const [uploadDetailOpen, setUploadDetailOpen] = useState(false);
  const [uploadDetailTab, setUploadDetailTab] = useState<"results" | "json" | "raw">("results");
  const [uploadDeleteConfirmOpen, setUploadDeleteConfirmOpen] = useState(false);
  const [deletingUploadId, setDeletingUploadId] = useState<string | null>(null);

  const handleOpenUpload = () => {
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (payload: { student_id: string; textContent: string }) => {
    try {
      await transcriptUploadsHook.createUpload(payload);
      setUploadModalOpen(false);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Tải bảng điểm thất bại");
    }
  };

  const handleOpenUploadDetail = (row: UploadItem) => {
    setSelectedUploadItem(row);
    setUploadDetailTab("results");
    setUploadDetailOpen(true);
  };

  const handleUploadDelete = (id: string) => {
    setDeletingUploadId(id);
    setUploadDeleteConfirmOpen(true);
  };

  const handleConfirmUploadDelete = async () => {
    if (deletingUploadId) {
      try {
        await transcriptUploadsHook.deleteItem(deletingUploadId);
        setUploadDeleteConfirmOpen(false);
        setDeletingUploadId(null);
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa phiên tải lên thất bại");
      }
    }
  };

  // Upload Session Columns
  const uploadColumns = [
    {
      header: "Phiên tải lên",
      render: (row: UploadItem) => (
        <div>
          <span className="text-slate-200 font-medium block">ID phiên</span>
          <span className="text-[10px] text-slate-500 font-mono block">{row.id}</span>
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
        <div className="text-xs text-slate-450 font-mono">
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
            onClick={() => handleOpenUploadDetail(row)}
            title="Xem chi tiết phân tích"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleUploadDelete(row.id)}
            title="Xóa phiên"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {transcriptUploadsHook.error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {transcriptUploadsHook.error}
        </div>
      )}

      <DataTable<UploadItem>
        columns={uploadColumns}
        data={transcriptUploadsHook.data}
        loading={transcriptUploadsHook.loading}
        total={transcriptUploadsHook.total}
        page={transcriptUploadsHook.page}
        limit={transcriptUploadsHook.limit}
        onPageChange={transcriptUploadsHook.setPage}
        onLimitChange={transcriptUploadsHook.setLimit}
        searchValue={transcriptUploadsHook.search}
        onSearchChange={transcriptUploadsHook.setSearch}
        searchPlaceholder="Tìm kiếm phiên tải lên..."
        rightActions={
          <button
            onClick={handleOpenUpload}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tải bảng điểm mới
          </button>
        }
      />

      {/* MODALS */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Nhập tệp bảng điểm sinh viên"
        size="lg"
      >
        <TranscriptUploadForm
          key={studentId}
          studentId={studentId}
          studentLabel={studentLabel}
          onSubmit={handleUploadSubmit}
          onCancel={() => setUploadModalOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={uploadDeleteConfirmOpen}
        onClose={() => {
          setUploadDeleteConfirmOpen(false);
          setDeletingUploadId(null);
        }}
        title="Xóa phiên tải lên"
        message="Bạn có chắc chắn muốn xóa phiên tải lên này? Tất cả các kết quả học tập liên quan trong phiên này cũng sẽ bị xóa."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmUploadDelete}
      />

      {selectedUploadItem && (
        <Modal
          isOpen={uploadDetailOpen}
          onClose={() => setUploadDetailOpen(false)}
          title={`Chi tiết phiên tải lên - ${selectedUploadItem.full_name || selectedUploadItem.student_code || selectedUploadItem.id}`}
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Sinh viên:</span>
                <span className="text-slate-205! font-bold block">{selectedUploadItem.full_name || "N/A"}</span>
                <span className="text-[10px] text-slate-400 font-mono block">{selectedUploadItem.student_code || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Trạng thái:</span>
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide mt-1 ${
                  selectedUploadItem.parse_status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedUploadItem.parse_status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {selectedUploadItem.parse_status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ngày tải lên:</span>
                <span className="text-slate-205 block font-mono mt-1">{new Date(selectedUploadItem.uploaded_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ID phiên:</span>
                <span className="text-slate-205 block font-mono truncate mt-1" title={selectedUploadItem.id}>{selectedUploadItem.id}</span>
              </div>
            </div>

            <div className="flex border-b border-slate-800 gap-2">
              <button
                onClick={() => setUploadDetailTab("results")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  uploadDetailTab === "results"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Kết quả môn học
              </button>
              <button
                onClick={() => setUploadDetailTab("json")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  uploadDetailTab === "json"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Dữ liệu JSON phân tích
              </button>
              <button
                onClick={() => setUploadDetailTab("raw")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  uploadDetailTab === "raw"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Văn bản gốc
              </button>
            </div>

            <div className="min-h-60 overflow-auto" style={{ maxHeight: "450px" }}>
              {uploadDetailTab === "results" && (
                <div className="space-y-4">
                  {selectedUploadItem.parse_error && (
                    <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20 font-mono">
                      <strong>Lỗi phân tích:</strong> {selectedUploadItem.parse_error}
                    </div>
                  )}

                  {selectedUploadItem.parsed_json?.results && selectedUploadItem.parsed_json.results.length > 0 ? (
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-450 font-bold border-b border-slate-800">
                            <th className="p-3">Học kỳ</th>
                            <th className="p-3">Mã môn</th>
                            <th className="p-3">Tên môn học</th>
                            <th className="p-3 text-center">Tín chỉ</th>
                            <th className="p-3 text-center">Hệ 10</th>
                            <th className="p-3 text-center">Hệ 4</th>
                            <th className="p-3 text-center">Điểm chữ</th>
                            <th className="p-3">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {selectedUploadItem.parsed_json.results.map((res: ParsedResultItem, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                              <td className="p-3 font-medium text-slate-450">
                                {res.schoolYear === 'Bảo lưu' ? (
                                  <span className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">Bảo lưu</span>
                                ) : (
                                  `${res.schoolYear} - HK${res.semesterNumber}`
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-indigo-400">{res.courseCode}</td>
                              <td className="p-3">{res.courseName || "N/A"}</td>
                              <td className="p-3 text-center font-semibold text-slate-400">{res.credits ?? 0}</td>
                              <td className="p-3 text-center font-mono">{res.score10 !== null ? res.score10 : "-"}</td>
                              <td className="p-3 text-center font-mono">{res.score4 !== null ? res.score4 : "-"}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-200">{res.letterGrade || "-"}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  res.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  res.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {res.status === 'PASSED' ? 'ĐẠT' : res.status === 'FAILED' ? 'KHÔNG ĐẠT' : 'ĐANG HỌC'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Không có kết quả môn học nào được tìm thấy hoặc phân tích lỗi.
                    </div>
                  )}
                </div>
              )}

              {uploadDetailTab === "json" && (
                <pre className="bg-slate-955 p-4 rounded-xl text-xs overflow-auto font-mono text-emerald-400 max-h-96 border border-slate-800">
                  {JSON.stringify(selectedUploadItem.parsed_json || { message: "Không có dữ liệu JSON" }, null, 2)}
                </pre>
              )}

              {uploadDetailTab === "raw" && (
                <pre className="bg-slate-955 p-4 rounded-xl text-xs overflow-auto font-mono text-slate-300 max-h-96 whitespace-pre-wrap border border-slate-800">
                  {selectedUploadItem.raw_text}
                </pre>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setUploadDetailOpen(false)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
