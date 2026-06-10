"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  Search,
  Plus,
  Loader2,
  ListOrdered,
  Edit2,
  Trash2,
  X
} from "lucide-react";
import { RowItem } from "../types";

interface RowsTabPaneProps {
  classId: string;
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
}

export default function RowsTabPane({
  classId,
  refreshKey,
  setRefreshKey,
  setNotification
}: RowsTabPaneProps) {
  const [data, setData] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");

  // CRUD Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<RowItem | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  // Form Fields
  const [rowNumber, setRowNumber] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">("PENDING");
  const [rowError, setRowError] = useState("");
  const [savingRow, setSavingRow] = useState(false);

  const fetchRowsList = useCallback(async () => {
    setLoading(true);
    try {
      const q = `/class_import_rows/pagination?class_id=${classId}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
      const res = await api.get(q);
      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load import rows:", err);
    } finally {
      setLoading(false);
    }
  }, [classId, page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRowsList();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRowsList, refreshKey]);

  const handleOpenCreate = () => {
    setEditingRow(null);
    setRowNumber("");
    setStudentCode("");
    setFullName("");
    setEmail("");
    setStatus("PENDING");
    setRowError("");
    setFormOpen(true);
  };

  const handleOpenEdit = (item: RowItem) => {
    setEditingRow(item);
    setRowNumber(item.row_number.toString());
    setStudentCode(item.student_code);
    fullNameVal(item.full_name);
    setEmail(item.email || "");
    setStatus(item.row_status);
    setRowError(item.row_error || "");
    setFormOpen(true);
  };

  const fullNameVal = (name: string) => {
    setFullName(name);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !fullName.trim()) {
      setNotification({ type: "error", title: "Lỗi lưu", message: "Vui lòng nhập MSSV và Họ tên." });
      return;
    }

    setSavingRow(true);
    const payload = {
      row_number: rowNumber ? Number(rowNumber) : 1,
      student_code: studentCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      email: email.trim() || null,
      row_status: status,
      row_error: rowError.trim() || null
    };

    try {
      if (editingRow) {
        await api.patch(`/class_import_rows/${editingRow.id}`, payload);
      } else {
        // We need an active import session to link rows, let's look for one or create row directly if server allows
        const activeSessions = await api.get(`/class_imports?class_id=${classId}&limit=1`);
        if (activeSessions.data && activeSessions.data.length > 0) {
          const importId = activeSessions.data[0].id;
          await api.post("/class_import_rows", { ...payload, import_id: importId });
        } else {
          // Create a mock import session first to host the manual row
          const mockSession = await api.post("/class_imports", { sourceType: "text", textContent: "", classId, note: "Thêm thủ công" });
          const importId = mockSession.data?.importSession?.id;
          if (importId) {
            await api.post("/class_import_rows", { ...payload, import_id: importId });
          } else {
            throw new Error("Không tìm thấy phiên làm việc hoạt động.");
          }
        }
      }

      setNotification({ type: "success", title: "Thành công", message: "Đã cập nhật cấu hình dòng nhập." });
      setFormOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi",
        message: error.response?.data?.message || "Lưu thông tin dòng thất bại."
      });
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRowId) return;
    try {
      await api.delete(`/class_import_rows/${deletingRowId}`);
      setNotification({ type: "success", title: "Xóa thành công", message: "Đã xóa dòng bóc tách." });
      setDeletingRowId(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeletingRowId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: error.response?.data?.message || "Không thể xóa dòng bóc tách này."
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
            placeholder="Tìm kiếm mã số hoặc tên sinh viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-neutral-50/50"
          />
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-55 transition-all cursor-pointer"
        >
          <Plus size={14} />
          Tạo dòng thủ công
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-neutral-400">Đang tải chi tiết dòng bóc tách...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <ListOrdered size={22} />
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Không có chi tiết dòng nhập</h3>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Chưa có dòng sinh viên thô nào được bóc tách cho lớp này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3 w-20">Dòng số</th>
                  <th className="px-5 py-3">Hồ sơ sinh viên</th>
                  <th className="px-5 py-3">Email liên kết</th>
                  <th className="px-5 py-3 text-center">Trạng thái dòng</th>
                  <th className="px-5 py-3">Chi tiết lỗi</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-neutral-700">
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition bg-emerald-50/5">
                    <td className="px-5 py-3.5 font-mono text-neutral-450">
                      #{row.row_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-neutral-900 font-bold block">{row.full_name}</span>
                      <span className="text-[9px] text-neutral-455 font-mono block">MSSV: {row.student_code}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-neutral-500">
                      {row.email || <span className="text-zinc-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        row.row_status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        row.row_status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}>
                        {row.row_status === "SUCCESS" ? "Đã nhập" : row.row_status === "FAILED" ? "Thất bại" : "Chờ xử lý"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-red-500 text-[10px] max-w-40 truncate" title={row.row_error || ""}>
                      {row.row_error || <span className="text-neutral-300 font-normal">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-555 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                          title="Sửa dòng"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingRowId(row.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition cursor-pointer"
                          title="Xóa dòng"
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
          <span>Tổng số: {total} dòng</span>
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

      {/* Modal: Create/Edit Row */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="p-6 border-b border-zinc-150">
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
                {editingRow ? "Chỉnh sửa dòng bóc tách" : "Tạo dòng bóc tách mới"}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-neutral-600 font-semibold text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Dòng số</label>
                  <input
                    type="number"
                    value={rowNumber}
                    onChange={(e) => setRowNumber(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">MSSV *</label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Email liên kết</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Trạng thái bóc tách</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "PENDING" | "SUCCESS" | "FAILED")}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="PENDING">Chờ xử lý (PENDING)</option>
                  <option value="SUCCESS">Thành công (SUCCESS)</option>
                  <option value="FAILED">Thất bại (FAILED)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Chi tiết lỗi bóc tách</label>
                <input
                  type="text"
                  placeholder="Lỗi định dạng cột..."
                  value={rowError}
                  onChange={(e) => setRowError(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingRow}
                  className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
                >
                  {savingRow && <Loader2 size={12} className="animate-spin text-white" />}
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRowId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase">
                Xóa dòng bóc tách
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa vĩnh viễn dòng bóc tách này khỏi hệ thống? Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingRowId(null)}
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
    </div>
  );
}
