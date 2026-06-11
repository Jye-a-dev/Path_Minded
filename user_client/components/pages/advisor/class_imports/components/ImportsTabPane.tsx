"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  FolderInput,
  Loader2,
  Plus,
  Search,
  CheckCircle2,
  Filter,
  Trash2
} from "lucide-react";
import { ImportItem, ParsedStudentItem, WarningItem } from "../types";
import UploadPreviewModal from "./UploadPreviewModal";
import ConfirmActionModal from "./ConfirmActionModal";

interface ImportsTabPaneProps {
  classId: string;
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
}

export default function ImportsTabPane({
  classId,
  refreshKey,
  setRefreshKey,
  setNotification
}: ImportsTabPaneProps) {
  const [data, setData] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal control
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deletingImportId, setDeletingImportId] = useState<string | null>(null);
  const [confirmingImportId, setConfirmingImportId] = useState<string | null>(null);

  // Upload/Preview session states
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [sourceType, setSourceType] = useState<"file" | "text">("file");

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ParsedStudentItem[] | null>(null);
  const [previewWarnings, setPreviewWarnings] = useState<WarningItem[]>([]);
  const [selectedPreviewCodes, setSelectedPreviewCodes] = useState<Set<string>>(new Set());
  const [submittingPreview, setSubmittingPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchImportsList = useCallback(async () => {
    setLoading(true);
    try {
      const q = `/class_imports/pagination?class_id=${classId}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&import_status=${statusFilter}`;
      const res = await api.get(q);
      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load imports history:", err);
    } finally {
      setLoading(false);
    }
  }, [classId, page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchImportsList();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchImportsList, refreshKey]);

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceType === "file" && !file) {
      setNotification({ type: "error", title: "Thiếu dữ liệu", message: "Vui lòng chọn tệp tin Excel để tải lên." });
      return;
    }
    if (sourceType === "text" && !textContent.trim()) {
      setNotification({ type: "error", title: "Thiếu dữ liệu", message: "Vui lòng nhập nội dung văn bản sao chép." });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("sourceType", sourceType);
    formData.append("classId", classId);
    formData.append("note", uploadNote.trim());
    if (sourceType === "file" && file) {
      formData.append("file", file);
    } else {
      formData.append("textContent", textContent.trim());
    }

    try {
      const startRes = await api.post("/class_imports", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const res = startRes.data;
      if (res?.importSession) {
        setPreviewData(res.preview || []);
        setPreviewWarnings(res.warnings || []);
        setSelectedPreviewCodes(new Set((res.preview || []).map((s: ParsedStudentItem) => s.studentCode)));
        setActiveSessionId(res.importSession.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Tải lên thất bại",
        message: error.response?.data?.message || "Lỗi bóc tách dòng dữ liệu."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelPreview = async () => {
    if (activeSessionId) {
      try {
        await api.delete(`/class_imports/${activeSessionId}`);
      } catch (err) {
        console.error("Failed to discard temporary session:", err);
      }
    }
    setPreviewData(null);
    setPreviewWarnings([]);
    setActiveSessionId(null);
    setFile(null);
    setTextContent("");
    setUploadNote("");
  };

  const handleConfirmPreview = async () => {
    if (!activeSessionId || !previewData) return;
    setSubmittingPreview(true);
    try {
      const selected = previewData
        .filter((s) => selectedPreviewCodes.has(s.studentCode))
        .map((s) => ({
          student_code: s.studentCode,
          full_name: s.fullName,
          email: s.email
        }));

      await api.post(`/class_imports/${activeSessionId}/confirm`, {
        students: selected
      });

      setNotification({
        type: "success",
        title: "Thành công",
        message: "Xác nhận danh sách sinh viên lớp học và lưu vào DB thành công!"
      });
      setImportModalOpen(false);
      setPreviewData(null);
      setPreviewWarnings([]);
      setActiveSessionId(null);
      setFile(null);
      setTextContent("");
      setUploadNote("");
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi lưu kết quả",
        message: error.response?.data?.message || "Nhập danh sách sinh viên thất bại."
      });
    } finally {
      setSubmittingPreview(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingImportId) return;
    try {
      await api.delete(`/class_imports/${deletingImportId}`);
      setNotification({ type: "success", title: "Xóa thành công", message: "Đã xóa vĩnh viễn phiên nhập lớp học." });
      setDeletingImportId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeletingImportId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: error.response?.data?.message || "Xóa phiên nhập lớp thất bại."
      });
    }
  };

  const handleConfirmImportRow = async () => {
    if (!confirmingImportId) return;
    try {
      await api.post(`/class_imports/${confirmingImportId}/confirm`, { students: [] });
      setNotification({ type: "success", title: "Thành công", message: "Phiên nhập đã được xác nhận lưu." });
      setConfirmingImportId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setConfirmingImportId(null);
      setNotification({
        type: "error",
        title: "Lỗi xác nhận",
        message: error.response?.data?.message || "Lỗi lưu kết quả bóc tách."
      });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên file..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-neutral-50/50"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
            <Filter size={14} className="text-neutral-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
            </select>
          </div>
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-55 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Tải lên danh sách
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-neutral-400">Đang tải lịch sử nhập lớp học...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <FolderInput size={22} />
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Không có dữ liệu bóc tách</h3>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Lớp này chưa thực hiện tải lên danh sách sinh viên nào. Bấm nút Tải lên danh sách để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3">Chi tiết phiên</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                  <th className="px-5 py-3">Thời gian tải lên</th>
                  <th className="px-5 py-3">Lịch sử lỗi</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-neutral-700">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition bg-emerald-50/5">
                    <td className="px-5 py-3.5">
                      <span className="text-neutral-900 font-bold block">{row.file_name}</span>
                      <span className="text-[9px] text-neutral-400 font-mono block">ID: {row.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        row.import_status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        row.import_status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {row.import_status === "SUCCESS" ? "THÀNH CÔNG" : row.import_status === "FAILED" ? "THẤT BẠI" : "CHỜ LƯU"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-505 text-[10px]">
                      Tải lên: {new Date(row.uploaded_at).toLocaleString("vi-VN")}
                      {row.processed_at && (
                        <div className="text-emerald-700 font-bold mt-0.5">Xử lý: {new Date(row.processed_at).toLocaleString("vi-VN")}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-red-500 text-[10px] max-w-40 truncate" title={row.import_error || ""}>
                      {row.import_error || <span className="text-neutral-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        {row.import_status === "PENDING" && (
                          <button
                            onClick={() => setConfirmingImportId(row.id)}
                            className="inline-flex items-center justify-center p-2 rounded-lg border border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                            title="Xác nhận lưu"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeletingImportId(row.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition cursor-pointer"
                          title="Xóa phiên"
                        >
                          <Trash2 size={13} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-150 pt-4 text-xs font-bold text-neutral-500">
          <span>Tổng số: {total} phiên nhập</span>
          <div className="inline-flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              Trước
            </button>
            <span>Trang {page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-neutral-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal: Upload & Preview */}
      <UploadPreviewModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        classId={classId}
        file={file}
        setFile={setFile}
        textContent={textContent}
        setTextContent={setTextContent}
        uploadNote={uploadNote}
        setUploadNote={setUploadNote}
        sourceType={sourceType}
        setSourceType={setSourceType}
        isUploading={isUploading}
        previewData={previewData}
        previewWarnings={previewWarnings}
        selectedPreviewCodes={selectedPreviewCodes}
        setSelectedPreviewCodes={setSelectedPreviewCodes}
        submittingPreview={submittingPreview}
        handleStartImport={handleStartImport}
        handleCancelPreview={handleCancelPreview}
        handleConfirmPreview={handleConfirmPreview}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmActionModal
        isOpen={!!deletingImportId}
        onClose={() => setDeletingImportId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa phiên nhập lớp học"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập này khỏi lịch sử? Tất cả thông tin của phiên cũng sẽ biến mất."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        type="danger"
      />

      {/* Confirmation of Save Modal */}
      <ConfirmActionModal
        isOpen={!!confirmingImportId}
        onClose={() => setConfirmingImportId(null)}
        onConfirm={handleConfirmImportRow}
        title="Xác nhận nhập lớp học"
        message="Bạn có đồng ý lưu toàn bộ danh sách sinh viên của phiên nhập này vào cơ sở dữ liệu lớp học?"
        confirmText="Xác nhận lưu"
        cancelText="Hủy"
        type="success"
      />
    </div>
  );
}
