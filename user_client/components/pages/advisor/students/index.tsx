"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  Users,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Search,
  Loader2,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from "lucide-react";

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  class_id?: string | null;
  program_id?: string | null;
  cohort_year?: number | null;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id?: string | null;
}

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
}

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
}

interface UserAccount {
  id: string;
  email: string;
  role: string;
}

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

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudentItem | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Form states
  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [classId, setClassId] = useState("");
  const [programId, setProgramId] = useState("");
  const [cohortYear, setCohortYear] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "GRADUATED" | "DROPPED">("ACTIVE");
  const [userId, setUserId] = useState("");

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
        const classesRes = await api.get(`/classes?advisor_id=${advisorRec.id}&limit=500`);
        const myClasses: ClassItem[] = classesRes.data || [];
        setClasses(myClasses);
        const myClassIds = new Set(myClasses.map((c) => c.id));

        // 3. Fetch programs
        const programsRes = await api.get("/programs?limit=250");
        setPrograms(programsRes.data || []);

        // 4. Fetch students and filter to only include those in my classes
        const studentsRes = await api.get("/students?limit=1000");
        const allStudents: StudentItem[] = studentsRes.data || [];
        const myStudents = allStudents.filter((s) => s.class_id && myClassIds.has(s.class_id));
        setStudents(myStudents);

        // 5. Fetch student user accounts for linking
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
    void fetchData();
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
    setStudentCode("");
    setFullName("");
    setClassId(classes[0]?.id || "");
    setProgramId(programs[0]?.id || "");
    setCohortYear(new Date().getFullYear().toString());
    setStatus("ACTIVE");
    setUserId("");
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: StudentItem) => {
    setEditingItem(item);
    setStudentCode(item.student_code);
    setFullName(item.full_name);
    setClassId(item.class_id || "");
    setProgramId(item.program_id || "");
    setCohortYear(item.cohort_year?.toString() || "");
    setStatus(item.status);
    setUserId(item.user_id || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !fullName.trim()) {
      setFormError("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    if (!classId) {
      setFormError("Vui lòng chọn Lớp học");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      student_code: studentCode.trim().toUpperCase(),
      full_name: fullName.trim(),
      class_id: classId,
      program_id: programId || null,
      cohort_year: cohortYear ? Number(cohortYear) : null,
      status,
      user_id: userId || null
    };

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
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Lỗi lưu thông tin sinh viên");
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
    } catch (err: any) {
      setDeletingStudent(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa sinh viên",
        message: err.response?.data?.message || "Không thể xóa sinh viên này"
      });
    }
  };

  const handleSyncUsersConfirm = async () => {
    if (classes.length === 0) return;
    setShowSyncConfirm(false);
    setLoading(true);
    try {
      let syncedCount = 0;
      // Sync for each class managed by the advisor
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
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi đồng bộ",
        message: err.response?.data?.message || "Lỗi đồng bộ tài khoản"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      s.student_code.toLowerCase().includes(query) ||
      s.full_name.toLowerCase().includes(query);

    const matchesClass = !selectedClass || s.class_id === selectedClass;
    const matchesStatus = !selectedStatus || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

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

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-250">
            Đang học
          </span>
        );
      case "GRADUATED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-250">
            Tốt nghiệp
          </span>
        );
      case "DROPPED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-250">
            Thôi học
          </span>
        );
      default:
        return null;
    }
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
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer disabled:opacity-55"
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
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <Users size={26} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy sinh viên nào</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Bạn chưa quản lý sinh viên nào trong các lớp học được giao.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">MSSV</th>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-5 py-3.5">Lớp</th>
                  <th className="px-5 py-3.5">Khóa</th>
                  <th className="px-5 py-3.5">Chương trình đào tạo</th>
                  <th className="px-5 py-3.5">Tài khoản</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredStudents.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-neutral-50/50 transition-colors text-neutral-700 bg-emerald-50/5"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-neutral-900 text-xs">
                      {item.student_code}
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">
                      {item.full_name}
                    </td>
                    <td className="px-5 py-4 font-bold text-neutral-600">
                      {getClassName(item.class_id)}
                    </td>
                    <td className="px-5 py-4 text-neutral-500 font-bold font-mono">
                      K{item.cohort_year ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-neutral-500">
                      {getProgramCode(item.program_id)}
                    </td>
                    <td className="px-5 py-4 font-mono text-neutral-500 text-xs">
                      {item.user_id ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={10} /> Đã liên kết
                        </span>
                      ) : (
                        <span className="text-zinc-300 font-normal">Chưa tạo TK</span>
                      )}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Sửa hồ sơ"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(item)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition-colors cursor-pointer"
                          title="Xóa hồ sơ"
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

      {/* Create / Edit Modal */}
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
                <GraduationCap className="text-emerald-600" size={20} />
                {editingItem ? "Sửa Hồ sơ Sinh viên" : "Thêm Sinh viên mới"}
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
                  Mã số sinh viên (MSSV) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SE170233"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Niên khóa
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
                  Lớp sinh viên (Chỉ lớp của bạn) <span className="text-red-500">*</span>
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-bold"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_code} - {c.class_name || "Lớp học"}
                    </option>
                  ))}
                </select>
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
                  <option value="">Chưa chọn</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.program_name} ({p.program_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tài khoản liên kết (E-mail)
                </label>
                <select
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                >
                  <option value="">Không liên kết tài khoản</option>
                  {usersList.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Trạng thái học tập
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-emerald-500 cursor-pointer font-semibold"
                >
                  <option value="ACTIVE">Đang học (ACTIVE)</option>
                  <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
                  <option value="DROPPED">Thôi học (DROPPED)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 border border-zinc-255 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
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

      {/* Custom Sync Confirmation Modal */}
      {showSyncConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <UserCheck className="text-emerald-600 h-5 w-5 shrink-0" />
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
                Đồng bộ tài khoản sinh viên
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Hệ thống sẽ tự động ghép nối tài khoản sinh viên dựa trên tên. Bạn có muốn tiếp tục?
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSyncConfirm(false)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSyncUsersConfirm}
                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                Xác nhận đồng bộ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
                Xóa hồ sơ sinh viên
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa hồ sơ sinh viên <span className="font-extrabold text-neutral-900 underline">{deletingStudent.student_code} ({deletingStudent.full_name})</span>? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
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
