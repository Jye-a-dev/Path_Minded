"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  Users,
  Plus,
  Search,
  Loader2,
  Filter,
  AlertCircle,
  UserCheck
} from "lucide-react";

import StudentModal, { StudentItem, ClassItem, ProgramItem, UserAccount } from "./components/StudentModal";
import SyncConfirmModal from "./components/SyncConfirmModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import NotificationModal, { NotificationItem } from "./components/NotificationModal";
import StudentsTable from "./components/StudentsTable";
import AdvisingLogModal from "./components/AdvisingLogModal";

interface Advisor {
  id: string;
  full_name: string;
}

export default function AdvisorStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "warning">("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const [advisingStudent, setAdvisingStudent] = useState<StudentItem | null>(null);
  const [advisingModalOpen, setAdvisingModalOpen] = useState(false);

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
        const classesRes = await api.get(`/classes?advisor_id=${advisorRec.id}&limit=500`);
        const myClasses: ClassItem[] = classesRes.data || [];
        setClasses(myClasses);
        const myClassIds = new Set(myClasses.map((c) => c.id));

        const programsRes = await api.get("/programs?limit=250");
        setPrograms(programsRes.data || []);

        const studentsRes = await api.get("/students?limit=1000");
        const allStudents: StudentItem[] = studentsRes.data || [];
        const myStudents = allStudents.filter((s) => s.class_id && myClassIds.has(s.class_id));
        setStudents(myStudents);

        try {
          const usersRes = await api.get("/users?role=STUDENT&limit=1000");
          setUsersList(usersRes.data || []);
        } catch {
          setUsersList([]);
        }
      } else {
        setClasses([]);
        setStudents([]);
        setPrograms([]);
      }
    } catch (err) {
      console.error("Failed to fetch students page data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenCreate = () => {
    if (classes.length === 0) {
      setNotification({
        type: "error",
        title: "Không thể thêm sinh viên",
        message: "Bạn chưa quản lý lớp học nào. Vui lòng tạo lớp học trước khi thêm sinh viên!"
      });
      return;
    }
    setEditingItem(null);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingItem(item);
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async (payload: {
    student_code: string;
    full_name: string;
    class_id: string;
    program_id: string | null;
    cohort_year: number | null;
    status: "ACTIVE" | "GRADUATED" | "DROPPED";
    user_id: string | null;
  }) => {
    setSaving(true);
    setFormError("");

    try {
      if (editingItem) {
        await api.patch(`/students/${editingItem.id}`, payload);
      } else {
        await api.post("/students", payload);
      }
      setModalOpen(false);
      
      // Reload students
      if (currentAdvisor) {
        const myClassIds = new Set(classes.map((c) => c.id));
        const studentsRes = await api.get("/students?limit=1000");
        const allStudents: StudentItem[] = studentsRes.data || [];
        const myStudents = allStudents.filter((s) => s.class_id && myClassIds.has(s.class_id));
        setStudents(myStudents);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || "Lỗi lưu thông tin sinh viên");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    const { id } = deletingStudent;
    try {
      await api.delete(`/students/${id}`);
      setStudents(students.filter((s) => s.id !== id));
      setDeletingStudent(null);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Hồ sơ sinh viên đã được xóa vĩnh viễn khỏi hệ thống."
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setDeletingStudent(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa sinh viên",
        message: error.response?.data?.message || "Không thể xóa sinh viên này"
      });
    }
  };

  const handleSyncUsersConfirm = async () => {
    if (classes.length === 0) return;
    setShowSyncConfirm(false);
    setLoading(true);
    try {
      let syncedCount = 0;
      for (const cls of classes) {
        const res = await api.post(`/students/sync-users?class_id=${cls.id}`);
        syncedCount += res.data?.synced || 0;
      }
      setNotification({
        type: "success",
        title: "Đồng bộ thành công",
        message: `Đã ghép nối tự động ${syncedCount} tài khoản sinh viên thành công.`
      });
      if (currentAdvisor) {
        const myClassIds = new Set(classes.map((c) => c.id));
        const studentsRes = await api.get("/students?limit=1000");
        const allStudents: StudentItem[] = studentsRes.data || [];
        const myStudents = allStudents.filter((s) => s.class_id && myClassIds.has(s.class_id));
        setStudents(myStudents);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotification({
        type: "error",
        title: "Lỗi đồng bộ",
        message: error.response?.data?.message || "Lỗi đồng bộ tài khoản"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityScore = (alertType?: string | null) => {
    if (alertType === "PROBATION_RISK") return 3;
    if (alertType === "GPA_WARNING") return 2;
    if (alertType === "CREDIT_WARNING") return 1;
    return 0;
  };

  // Filter & Sort students
  const sortedAndFilteredStudents = React.useMemo(() => {
    let list = students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        s.student_code.toLowerCase().includes(query) ||
        s.full_name.toLowerCase().includes(query);

      const matchesClass = !selectedClass || s.class_id === selectedClass;
      const matchesStatus = !selectedStatus || s.status === selectedStatus;
      
      const matchesWarningTab = activeFilterTab === "all" || !!s.active_alert_type;

      return matchesSearch && matchesClass && matchesStatus && matchesWarningTab;
    });

    // Sort: if on warning tab, sort by severity descending
    if (activeFilterTab === "warning") {
      list = [...list].sort((a, b) => {
        const scoreA = getSeverityScore(a.active_alert_type);
        const scoreB = getSeverityScore(b.active_alert_type);
        return scoreB - scoreA;
      });
    }

    return list;
  }, [students, searchQuery, selectedClass, selectedStatus, activeFilterTab]);

  const getClassName = (id?: string | null) => {
    if (!id) return "Chưa xếp lớp";
    const found = classes.find((c) => c.id === id);
    return found ? found.class_code : "N/A";
  };

  const getProgramCode = (id?: string | null) => {
    if (!id) return "Chưa chọn";
    const found = programs.find((p) => p.id === id);
    return found ? found.program_code : "N/A";
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải danh sách sinh viên...
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
            <Users size={12} />
            <span>Sinh viên tôi quản lý</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Sinh viên thuộc Lớp
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý hồ sơ học thuật, theo dõi tiến độ của sinh viên thuộc các lớp mà bạn được phân công.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSyncConfirm(true)}
            disabled={classes.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-55 hover:text-neutral-900 transition-all cursor-pointer disabled:opacity-55"
            title="Tự động liên kết tài khoản sinh viên dựa trên tên"
          >
            <UserCheck size={16} />
            Đồng bộ tài khoản
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-55 transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <Plus size={16} />
            Thêm sinh viên mới
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => setActiveFilterTab("all")}
          className={`pb-3 text-sm font-bold border-b-2 px-2 transition-all cursor-pointer ${
            activeFilterTab === "all"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          Tất cả sinh viên ({students.length})
        </button>
        <button
          onClick={() => setActiveFilterTab("warning")}
          className={`pb-3 text-sm font-bold border-b-2 px-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilterTab === "warning"
              ? "border-red-650 text-red-650"
              : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          <AlertCircle size={14} className={students.some(s => s.active_alert_type) ? "text-red-500 animate-pulse" : ""} />
          <span>Danh sách cảnh báo học vụ ({students.filter(s => s.active_alert_type).length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo MSSV hoặc tên sinh viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
            <Filter size={14} className="text-neutral-500" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
            >
              <option value="">Tất cả lớp của tôi</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
            <Filter size={14} className="text-neutral-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang học</option>
              <option value="GRADUATED">Đã tốt nghiệp</option>
              <option value="DROPPED">Thôi học</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <StudentsTable
          students={sortedAndFilteredStudents}
          onEdit={handleOpenEdit}
          onDelete={setDeletingStudent}
          onAdvisingLog={(item) => {
            setAdvisingStudent(item);
            setAdvisingModalOpen(true);
          }}
          getClassName={getClassName}
          getProgramCode={getProgramCode}
        />
      </div>

      {/* Create / Edit Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        classes={classes}
        programs={programs}
        usersList={usersList}
        saving={saving}
        error={formError}
        setError={setFormError}
      />

      {/* Sync Confirmation Modal */}
      <SyncConfirmModal
        isOpen={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleSyncUsersConfirm}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteConfirm}
        studentCode={deletingStudent?.student_code || ""}
        studentName={deletingStudent?.full_name || ""}
      />

      {/* Alert/Notification Modal */}
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* Advising Logs CRUD Modal */}
      <AdvisingLogModal
        isOpen={advisingModalOpen}
        onClose={() => setAdvisingModalOpen(false)}
        student={advisingStudent}
        advisorId={currentAdvisor?.id || null}
        onAlertResolved={fetchData}
      />
    </div>
  );
}
