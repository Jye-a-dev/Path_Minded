"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import {
  Search,
  Filter,
  Trash2,
  Plus,
  Loader2,
  GraduationCap,
  Edit2,
  X
} from "lucide-react";
import { ClassItem, ProgramItem, StudentItem, UserAccount } from "../types";

interface StudentsTabPaneProps {
  classId: string;
  classesList: ClassItem[];
  allPrograms: ProgramItem[];
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
}

export default function StudentsTabPane({
  classId,
  classesList,
  allPrograms,
  refreshKey,
  setRefreshKey,
  setNotification
}: StudentsTabPaneProps) {
  const [data, setData] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // CRUD Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  // Form Fields
  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "GRADUATED" | "DROPPED">("ACTIVE");
  const [userId, setUserId] = useState("");
  const [targetClassId, setTargetClassId] = useState(classId);
  const [programId, setProgramId] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  // Lists
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [deletingAllLoading, setDeletingAllLoading] = useState(false);

  const fetchStudentsList = useCallback(async () => {
    setLoading(true);
    try {
      const q = `/students/pagination?class_id=${classId}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`;
      const res = await api.get(q);
      setData(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load students list:", err);
    } finally {
      setLoading(false);
    }
  }, [classId, page, limit, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStudentsList();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStudentsList, refreshKey]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRes = await api.get("/users?role=STUDENT&limit=1000");
        setUsersList(usersRes.data || []);
      } catch {
        setUsersList([]);
      }
    };
    if (formOpen) void fetchUsers();
  }, [formOpen]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setStudentCode("");
    setFullName("");
    setCohortYear(new Date().getFullYear().toString());
    setStatus("ACTIVE");
    setUserId("");
    setTargetClassId(classId);
    // Find program of current class
    const foundClass = classesList.find((c) => c.id === classId);
    setProgramId(foundClass?.program_id || "");
    setFormOpen(true);
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingStudent(item);
    setStudentCode(item.student_code);
    setFullName(item.full_name);
    setCohortYear(item.cohort_year?.toString() || "");
    setStatus(item.status);
    setUserId(item.user_id || "");
    setTargetClassId(item.class_id || classId);
    setProgramId(item.program_id || "");
    setFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !fullName.trim()) {
      setNotification({ type: "error", title: "Lỗi lưu", message: "Vui lòng nhập MSSV và Họ tên." });
      return;
    }

    setSavingStudent(true);
    const payload = {
      student_code: studentCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      class_id: targetClassId || null,
      program_id: programId || null,
      cohort_year: cohortYear ? Number(cohortYear) : null,
      status,
      user_id: userId || null
    };

    try {
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, payload);
      } else {
        await api.post("/students", payload);
      }

      setNotification({ type: "success", title: "Thành công", message: "Đã cập nhật thông tin sinh viên." });
      setFormOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi",
        message: error.response?.data?.message || "Lưu hồ sơ sinh viên thất bại."
      });
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await api.delete(`/students/${deletingStudent.id}`);
      setNotification({ type: "success", title: "Xóa thành công", message: "Đã xóa vĩnh viễn hồ sơ sinh viên." });
      setDeletingStudent(null);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeletingStudent(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: error.response?.data?.message || "Không thể xóa hồ sơ sinh viên này."
      });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAllLoading(true);
    try {
      // In advisor mode, we should delete only students inside the active class to be safe and scoped
      for (const s of data) {
        await api.delete(`/students/${s.id}`);
      }
      setNotification({ type: "success", title: "Thành công", message: `Đã xóa sạch toàn bộ sinh viên thuộc lớp.` });
      setDeleteAllOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi",
        message: error.response?.data?.message || "Xóa toàn bộ sinh viên thất bại."
      });
    } finally {
      setDeletingAllLoading(false);
    }
  };

  const getProgramLabel = (pId: string | null) => {
    if (!pId) return "N/A";
    const found = allPrograms.find((p) => p.id === pId);
    return found ? `${found.program_name} (${found.program_code})` : "N/A";
  };

  const getClassName = (cId: string | null) => {
    if (!cId) return "Chưa xếp lớp";
    const found = classesList.find((c) => c.id === cId);
    return found ? found.class_code : "N/A";
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
              <option value="ACTIVE">Đang học</option>
              <option value="GRADUATED">Đã tốt nghiệp</option>
              <option value="DROPPED">Thôi học</option>
            </select>
          </div>
          <button
            onClick={() => setDeleteAllOpen(true)}
            disabled={data.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-650 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={14} />
            Dọn dẹp lớp
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-55 transition cursor-pointer"
          >
            <Plus size={14} />
            Tạo sinh viên
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-650 mx-auto" />
            <p className="text-xs text-neutral-400">Đang tải danh sách sinh viên hiện tại...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <GraduationCap size={22} />
            </div>
            <h3 className="text-xs font-bold text-neutral-800">Không có sinh viên trong lớp</h3>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Lớp này chưa có hồ sơ sinh viên nào. Bạn có thể thêm sinh viên thủ công hoặc tải lên danh sách bằng Excel ở Tab Phiên nhập lớp.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3">MSSV</th>
                  <th className="px-5 py-3">Họ và tên</th>
                  <th className="px-5 py-3">Khóa</th>
                  <th className="px-5 py-3">Lớp</th>
                  <th className="px-5 py-3">Chương trình đào tạo</th>
                  <th className="px-5 py-3 text-center">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-semibold text-neutral-700">
                {data.map((student) => (
                  <tr key={student.id} className="hover:bg-neutral-50/50 transition bg-emerald-50/5">
                    <td className="px-5 py-3.5 font-mono font-bold text-neutral-900">
                      {student.student_code}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="block font-bold">{student.full_name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-neutral-505">
                      {student.cohort_year ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {getClassName(student.class_id)}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-500 font-normal">
                      {getProgramLabel(student.program_id)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        student.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        student.status === "GRADUATED" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {student.status === "ACTIVE" ? "ĐANG HỌC" : student.status === "GRADUATED" ? "TỐT NGHIỆP" : "THÔI HỌC"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-555 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                          title="Sửa sinh viên"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition cursor-pointer"
                          title="Xóa sinh viên"
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
          <span>Tổng số: {total} sinh viên</span>
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

      {/* Modal: Create/Edit Student */}
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
                {editingStudent ? "Chỉnh sửa cấu hình Sinh viên" : "Đăng ký hồ sơ Sinh viên"}
              </h3>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-neutral-600 font-semibold text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Mã số sinh viên (MSSV) *</label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
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
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Niên khóa (Cohort Year)</label>
                <input
                  type="number"
                  value={cohortYear}
                  onChange={(e) => setCohortYear(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Lớp học sinh viên</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-bold"
                >
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_code} - {c.class_name || "Lớp học"}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Chương trình đào tạo</label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Chưa chọn</option>
                  {allPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.program_name} ({p.program_code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tài khoản liên kết (Email)</label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="">Không liên kết</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Trạng thái học tập</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "ACTIVE" | "GRADUATED" | "DROPPED")}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-bold"
                >
                  <option value="ACTIVE">Đang học (ACTIVE)</option>
                  <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
                  <option value="DROPPED">Thôi học (DROPPED)</option>
                </select>
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
                  disabled={savingStudent}
                  className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
                >
                  {savingStudent && <Loader2 size={12} className="animate-spin text-white" />}
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase">
                Xóa sinh viên
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ sinh viên <span className="font-extrabold text-neutral-900 underline">{deletingStudent.student_code} ({deletingStudent.full_name})</span>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="rounded-xl px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-lg shadow-rose-600/10"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {deleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase">
                Xóa sạch sinh viên
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa vĩnh viễn toàn bộ <span className="font-extrabold text-rose-700 underline">{total} sinh viên</span> trong lớp học hiện tại? Tất cả dữ liệu điểm số và lịch sử liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeleteAllOpen(false)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingAllLoading}
                onClick={handleDeleteAll}
                className="rounded-xl px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-lg shadow-rose-600/10"
              >
                {deletingAllLoading && <Loader2 size={12} className="animate-spin text-white" />}
                Xác nhận xóa sạch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
