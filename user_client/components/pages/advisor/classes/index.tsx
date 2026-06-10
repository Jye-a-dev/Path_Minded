"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Filter,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  cohort_year: number | null;
  advisor_id: string | null;
  program_id: string | null;
}

interface Advisor {
  id: string;
  full_name: string;
  department?: string | null;
  email?: string | null;
}

interface Program {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

export default function AdvisorClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCohort, setSelectedCohort] = useState("");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Form states
  const [classCode, setClassCode] = useState("");
  const [className, setClassName] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const [programId, setProgramId] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch current advisor profile
      const advRes = await api.get(`/advisors?user_id=${user.id}`);
      let advisorRec: Advisor | null = null;
      if (advRes.data && advRes.data.length > 0) {
        advisorRec = advRes.data[0];
        setCurrentAdvisor(advisorRec);
      }

      if (advisorRec) {
        // 2. Fetch only classes managed by this advisor
        const [classesRes, programsRes] = await Promise.all([
          api.get(`/classes?advisor_id=${advisorRec.id}&limit=500`),
          api.get("/programs?limit=250")
        ]);
        setClasses(classesRes.data || []);
        setPrograms(programsRes.data || []);
      } else {
        setClasses([]);
        setPrograms([]);
      }
    } catch (err) {
      console.error("Failed to load classes page data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        void fetchData();
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setClassCode("");
    setClassName("");
    setCohortYear(new Date().getFullYear().toString());
    setProgramId("");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditingItem(item);
    setClassCode(item.class_code);
    setClassName(item.class_name || "");
    setCohortYear(item.cohort_year?.toString() || "");
    setProgramId(item.program_id || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setFormError("Vui lòng nhập Mã lớp");
      return;
    }
    if (!currentAdvisor) {
      setFormError("Không tìm thấy hồ sơ cố vấn học tập của bạn");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      class_code: classCode.trim().toUpperCase(),
      class_name: className.trim() || null,
      cohort_year: cohortYear ? Number(cohortYear) : null,
      advisor_id: currentAdvisor.id, // Force advisor_id to the current advisor
      program_id: programId || null
    };

    try {
      if (editingItem) {
        await api.patch(`/classes/${editingItem.id}`, payload);
      } else {
        await api.post("/classes", payload);
      }
      setModalOpen(false);
      // Reload classes
      const classesRes = await api.get(`/classes?advisor_id=${currentAdvisor.id}&limit=500`);
      setClasses(classesRes.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || "Lỗi lưu thông tin lớp học");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClass) return;
    const { id } = deletingClass;
    try {
      await api.delete(`/classes/${id}`);
      setClasses(classes.filter((c) => c.id !== id));
      setDeletingClass(null);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Lớp học đã được xóa vĩnh viễn khỏi hệ thống."
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeletingClass(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa lớp học",
        message: error.response?.data?.message || "Không thể xóa lớp học này"
      });
    }
  };

  // Filter logic
  const filteredClasses = classes.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      c.class_code.toLowerCase().includes(query) ||
      (c.class_name && c.class_name.toLowerCase().includes(query));

    const matchesCohort = !selectedCohort || c.cohort_year?.toString() === selectedCohort;

    return matchesSearch && matchesCohort;
  });

  const getProgramName = (id: string | null) => {
    if (!id) return "Chưa chọn";
    const found = programs.find((p) => p.id === id);
    return found ? `${found.program_name} (${found.program_code})` : "Không tìm thấy";
  };

  const uniqueCohorts = Array.from(
    new Set(classes.map((c) => c.cohort_year).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải danh sách lớp học của bạn...
          </p>
        </div>
      </div>
    );
  }

  if (!currentAdvisor) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Không tìm thấy hồ sơ Cố vấn</h1>
        <p className="text-sm text-neutral-500">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ Cố vấn học tập nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <Building2 size={12} />
            <span>Lớp học tôi phụ trách</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Lớp học Cố vấn
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý danh sách lớp sinh viên và chương trình đào tạo liên kết mà bạn được phân công.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-55 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Tạo lớp học mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã lớp, tên lớp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
            <Filter size={14} className="text-neutral-500" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
            >
              <option value="">Tất cả khóa</option>
              {uniqueCohorts.map((y) => (
                <option key={y} value={y?.toString()}>
                  K{y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredClasses.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <Building2 size={26} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy lớp học nào</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Bạn chưa phụ trách lớp học nào. Hãy tạo một lớp học mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Mã lớp</th>
                  <th className="px-5 py-3.5">Tên lớp học</th>
                  <th className="px-5 py-3.5">Niên khóa</th>
                  <th className="px-5 py-3.5">Cố vấn phụ trách</th>
                  <th className="px-5 py-3.5">Chương trình đào tạo</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredClasses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 transition-colors text-neutral-700 bg-emerald-50/10"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-neutral-905 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 text-[10px] text-emerald-800 font-bold uppercase">
                        {item.class_code}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">
                      {item.class_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-neutral-505 font-bold font-mono">
                      {item.cohort_year ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-neutral-600 font-medium">
                      {currentAdvisor.full_name}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {getProgramName(item.program_id)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingClass(item)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition-colors cursor-pointer"
                          title="Xóa lớp"
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

      {/* Modal create/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition"
            >
              <X size={18} />
            </button>
            <div className="p-6 border-b border-zinc-150">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <Building2 className="text-emerald-600" size={20} />
                {editingItem ? "Cấu hình Lớp học" : "Tạo Lớp học mới"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Mã lớp học <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SE17A"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kỹ thuật phần mềm K17A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Niên khóa (Cohort Year)
                </label>
                <input
                  type="number"
                  placeholder="Ví dụ: 2023"
                  value={cohortYear}
                  onChange={(e) => setCohortYear(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Cố vấn học tập (Mặc định)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentAdvisor.full_name}
                  className="w-full border border-zinc-200 bg-neutral-50 rounded-xl px-3 py-2 text-sm text-neutral-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Chương trình đào tạo
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Chưa liên kết</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.program_name} ({p.program_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
                Xóa lớp học
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa lớp <span className="font-extrabold text-neutral-900 underline">{deletingClass.class_code}</span>? Tất cả dữ liệu liên quan đến lớp này có thể bị ảnh hưởng. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
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

      {/* Custom Alert/Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              {notification.type === "success" ? (
                <CheckCircle2 className="text-emerald-600 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="text-rose-600 h-5 w-5 shrink-0" />
              )}
              <h3 className={`text-sm font-extrabold uppercase tracking-wide ${notification.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                {notification.title}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                {notification.message}
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setNotification(null)}
                className={`rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white ${notification.type === "success" ? "bg-emerald-600 hover:bg-emerald-55 shadow-lg shadow-emerald-600/10" : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/10"}`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
