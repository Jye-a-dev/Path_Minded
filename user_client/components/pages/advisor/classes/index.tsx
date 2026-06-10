"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Filter,
  AlertCircle
} from "lucide-react";

import ClassModal, { ClassItem, Program } from "./components/ClassModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import NotificationModal, { NotificationItem } from "./components/NotificationModal";
import ClassesTable from "./components/ClassesTable";

interface Advisor {
  id: string;
  full_name: string;
  department?: string | null;
  email?: string | null;
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
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const advRes = await api.get(`/advisors?user_id=${user.id}`);
      let advisorRec: Advisor | null = null;
      if (advRes.data && advRes.data.length > 0) {
        advisorRec = advRes.data[0];
        setCurrentAdvisor(advisorRec);
      }

      if (advisorRec) {
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
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ClassItem) => {
    setEditingItem(item);
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (payload: {
    class_code: string;
    class_name: string | null;
    cohort_year: number | null;
    program_id: string | null;
  }) => {
    if (!currentAdvisor) return;

    setSaving(true);
    setFormError("");

    const fullPayload = {
      ...payload,
      advisor_id: currentAdvisor.id
    };

    try {
      if (editingItem) {
        await api.patch(`/classes/${editingItem.id}`, fullPayload);
      } else {
        await api.post("/classes", fullPayload);
      }
      setModalOpen(false);
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
        <ClassesTable
          classes={filteredClasses}
          onEdit={handleOpenEdit}
          onDelete={setDeletingClass}
          getProgramName={getProgramName}
          currentAdvisorName={currentAdvisor.full_name}
        />
      </div>

      {/* Modal create/edit */}
      <ClassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        programs={programs}
        currentAdvisorName={currentAdvisor.full_name}
        saving={saving}
        error={formError}
        setError={setFormError}
      />

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        isOpen={!!deletingClass}
        onClose={() => setDeletingClass(null)}
        onConfirm={handleDeleteConfirm}
        classCode={deletingClass?.class_code || ""}
      />

      {/* Notification Modal */}
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
