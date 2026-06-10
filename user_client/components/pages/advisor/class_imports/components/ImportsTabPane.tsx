"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  FolderInput,
  Loader2,
  Plus,
  CheckCircle,
  Trash2,
  X,
  Search,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Filter
} from "lucide-react";
import { ImportItem, ParsedStudentItem, WarningItem } from "../types";

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
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className={`bg-white border border-zinc-200 w-full rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${
            previewData ? "max-w-4xl" : "max-w-md"
          }`}>
            <button
              onClick={previewData ? handleCancelPreview : () => setImportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="p-6 border-b border-zinc-150 shrink-0">
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
                {previewData ? "Xem trước danh sách bóc tách sinh viên" : "Phiên nhập danh sách sinh viên mới"}
              </h3>
              <p className="text-[10px] text-neutral-455 uppercase font-mono tracking-wide mt-0.5">
                Nhóm lớp: {classId}
              </p>
            </div>

            {previewData ? (
              // ──────── Preview Screen ────────
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold text-xs text-neutral-600">
                {previewWarnings.length > 0 && (
                  <div className="rounded-xl border border-amber-250 bg-amber-50 p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <AlertTriangle size={14} />
                      <span>Cảnh báo định dạng ({previewWarnings.length})</span>
                    </div>
                    <ul className="list-disc pl-5 text-[11px] text-amber-700 leading-relaxed font-mono">
                      {previewWarnings.slice(0, 5).map((w, idx) => (
                        <li key={idx}>Dòng {w.rowNumber ?? "—"}: {w.message} (Gốc: {w.rawValue})</li>
                      ))}
                      {previewWarnings.length > 5 && <li>Và {previewWarnings.length - 5} cảnh báo khác...</li>}
                    </ul>
                  </div>
                )}

                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-neutral-400 font-bold text-[9px] uppercase tracking-wider">
                        <th className="px-4 py-2 text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedPreviewCodes.size === previewData.length}
                            onChange={() => {
                              if (selectedPreviewCodes.size === previewData.length) {
                                setSelectedPreviewCodes(new Set());
                              } else {
                                setSelectedPreviewCodes(new Set(previewData.map((s) => s.studentCode)));
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-2">Mã số sinh viên</th>
                        <th className="px-4 py-2">Họ và tên</th>
                        <th className="px-4 py-2">Email học thuật</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-neutral-700">
                      {previewData.map((s) => {
                        const isChecked = selectedPreviewCodes.has(s.studentCode);
                        return (
                          <tr key={s.studentCode} className="hover:bg-neutral-50/20">
                            <td className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = new Set(selectedPreviewCodes);
                                  if (next.has(s.studentCode)) next.delete(s.studentCode);
                                  else next.add(s.studentCode);
                                  setSelectedPreviewCodes(next);
                                }}
                                className="cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-2 font-mono font-bold text-neutral-900">{s.studentCode}</td>
                            <td className="px-4 py-2 font-bold">{s.fullName}</td>
                            <td className="px-4 py-2 font-mono text-[11px] text-neutral-450">{s.email || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
                  >
                    Hủy bỏ phiên
                  </button>
                  <button
                    type="button"
                    disabled={selectedPreviewCodes.size === 0 || submittingPreview}
                    onClick={handleConfirmPreview}
                    className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
                  >
                    {submittingPreview && <Loader2 size={12} className="animate-spin text-white" />}
                    Lưu {selectedPreviewCodes.size} hồ sơ vào DB
                  </button>
                </div>
              </div>
            ) : (
              // ──────── Upload Form Screen ────────
              <form onSubmit={handleStartImport} className="p-6 space-y-5 text-neutral-900 font-semibold text-xs flex-1 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Hình thức nhập</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSourceType("file")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                        sourceType === "file" 
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                          : "border-zinc-200 hover:bg-neutral-50 text-neutral-500"
                      }`}
                    >
                      <FileSpreadsheet size={14} />
                      Tải tệp Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => setSourceType("text")}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                        sourceType === "text" 
                          ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                          : "border-zinc-200 hover:bg-neutral-50 text-neutral-555"
                      }`}
                    >
                      <FileText size={14} />
                      Dán văn bản
                    </button>
                  </div>
                </div>

                {sourceType === "file" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tệp bảng tính Excel (.xls, .xlsx)</label>
                    <input
                      type="file"
                      required
                      accept=".xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files?.[0]) setFile(e.target.files[0]);
                      }}
                      className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-bold hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Dán văn bản danh sách thô</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Định dạng: MSSV,Họ tên,Email (mỗi dòng 1 sinh viên)"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full border border-zinc-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-none h-32"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Ghi chú phiên nhập</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Danh sách sinh viên chuyển lớp đợt 1..."
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
                  >
                    {isUploading && <Loader2 size={12} className="animate-spin text-white" />}
                    Bắt đầu bóc tách
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingImportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase">
                Xóa phiên nhập lớp học
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa vĩnh viễn phiên nhập này khỏi lịch sử? Tất cả thông tin của phiên cũng sẽ biến mất.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingImportId(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-lg shadow-rose-600/10"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation of Save Modal */}
      {confirmingImportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
              <h3 className="text-sm font-extrabold text-emerald-650 tracking-wide uppercase">
                Xác nhận nhập lớp học
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có đồng ý lưu toàn bộ danh sách sinh viên của phiên nhập này vào cơ sở dữ liệu lớp học?
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmingImportId(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmImportRow}
                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
