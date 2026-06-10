"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  FolderInput,
  Loader2,
  ChevronLeft,
  GraduationCap,
  ListOrdered,
  Plus,
  CheckCircle,
  Trash2,
  Eye,
  X,
  AlertCircle,
  Search,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Edit2,
  CheckCircle2,
  Filter
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface ImportItem {
  id: string;
  class_id?: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
}

interface RowItem {
  id: string;
  import_id: string;
  row_number: number;
  student_code: string;
  full_name: string;
  email: string | null;
  row_status: "PENDING" | "SUCCESS" | "FAILED";
  row_error: string | null;
  class_code?: string;
}

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  cohort_year: number | null;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  user_id: string | null;
  class_id: string | null;
  program_id: string | null;
  email?: string | null;
}

interface ParsedStudentItem {
  studentCode: string;
  fullName: string;
  email: string | null;
}

interface WarningItem {
  rowNumber: number | null;
  code: string;
  message: string;
  rawValue: string;
}

interface UserAccount {
  id: string;
  email: string;
  role: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdvisorClassImportsPage() {
  const { user } = useAuth();

  // Configuration States
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<{ id: string; full_name: string } | null>(null);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"imports" | "rows" | "students">("imports");
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom Modal States
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Fetch advisor, programs and classes
  useEffect(() => {
    const fetchConfigData = async () => {
      if (!user) return;
      setLoadingConfig(true);
      try {
        const advRes = await api.get(`/advisors?user_id=${user.id}`);
        if (advRes.data && advRes.data.length > 0) {
          const advRec = advRes.data[0];
          setCurrentAdvisor(advRec);

          // Get advisor's classes
          setLoadingClasses(true);
          const classesRes = await api.get(`/classes?advisor_id=${advRec.id}&limit=500`);
          setClasses(classesRes.data || []);
          setLoadingClasses(false);
        }

        const programsRes = await api.get("/programs?limit=250");
        setAllPrograms(programsRes.data || []);
      } catch (err) {
        console.error("Failed to load configuration details:", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    void fetchConfigData();
  }, [user]);

  // Derive unique majors from programs associated with advisor's classes
  const uniqueMajors = useMemo(() => {
    const programIds = new Set(classes.map((c) => c.program_id).filter(Boolean));
    const majors = allPrograms
      .filter((p) => programIds.has(p.id))
      .map((p) => p.major_name)
      .filter((m): m is string => !!m);
    return Array.from(new Set(majors)).sort();
  }, [classes, allPrograms]);

  // Filter classes based on selected major
  const classesForMajor = useMemo(() => {
    if (!selectedMajor) return [];
    const programIdsForMajor = new Set(
      allPrograms.filter((p) => p.major_name === selectedMajor).map((p) => p.id)
    );
    return classes.filter((c) => c.program_id && programIdsForMajor.has(c.program_id));
  }, [selectedMajor, classes, allPrograms]);

  const selectedClassCode = useMemo(() => {
    const found = classes.find((c) => c.id === selectedClassId);
    return found ? found.class_code : selectedClassId;
  }, [selectedClassId, classes]);

  if (loadingConfig) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải dữ liệu cấu hình...
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
          Tài khoản của bạn chưa được liên kết với hồ sơ Cố vấn học tập nào.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Setup Screen (Config Phase)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="space-y-8 max-w-xl mx-auto py-12">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-2">
            <FolderInput size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Nhập &amp; Quản lý lớp sinh viên
          </h1>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành và lớp học bạn phụ trách.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Chuyên ngành</label>
              <select
                value={selectedMajor}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setSelectedClassId("");
                }}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">-- Chọn chuyên ngành --</option>
                {uniqueMajors.map((major) => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Lớp học mục tiêu</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 py-2 border border-zinc-200 rounded-xl px-3 text-xs text-neutral-400">
                  <Loader2 size={12} className="animate-spin text-emerald-600" />
                  <span>Đang tải danh sách lớp...</span>
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  disabled={!selectedMajor || classesForMajor.length === 0}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-bold disabled:opacity-50"
                >
                  <option value="">
                    {!selectedMajor 
                      ? "-- Chọn chuyên ngành trước --" 
                      : classesForMajor.length === 0 
                      ? "-- Không tìm thấy lớp học phù hợp --" 
                      : "-- Chọn lớp học --"}
                  </option>
                  {classesForMajor.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_code}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedClassId}
            onClick={() => setIsConfigured(true)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 text-white font-bold py-2.5 text-xs shadow-lg shadow-emerald-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Vào bảng quản lý nhập liệu
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Panel (Configured Phase)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfigured(false);
              setSelectedClassId("");
              setActiveTab("imports");
            }}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 transition cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
                Nhập lớp học
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-100/70 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                Lớp: {selectedClassCode}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Quản lý tài liệu bóc tách và phân phối sinh viên cho lớp <span className="font-extrabold text-neutral-700 underline">{selectedClassCode}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {(["imports", "rows", "students"] as const).map((tab) => {
          const labels = {
            imports: "Phiên nhập lớp",
            rows: "Chi tiết dòng nhập",
            students: "Sinh viên hiện tại"
          };
          const icons = {
            imports: <FolderInput size={13} />,
            rows: <ListOrdered size={13} />,
            students: <GraduationCap size={13} />
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer -mb-px border-b-2 ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === "imports" && (
          <ImportsTabPane
            classId={selectedClassId}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
            selectedMajor={selectedMajor}
            allPrograms={allPrograms}
          />
        )}
        {activeTab === "rows" && (
          <RowsTabPane
            classId={selectedClassId}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
          />
        )}
        {activeTab === "students" && (
          <StudentsTabPane
            classId={selectedClassId}
            classesList={classes}
            allPrograms={allPrograms}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
          />
        )}
      </div>

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: IMPORTS TAB PANE
// ─────────────────────────────────────────────────────────────────────────────

interface ImportsTabPaneProps {
  classId: string;
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
  selectedMajor: string;
  allPrograms: ProgramItem[];
}

function ImportsTabPane({
  classId,
  refreshKey,
  setRefreshKey,
  setNotification,
  selectedMajor,
  allPrograms
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
    void fetchImportsList();
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
        setSelectedPreviewCodes(new Set((res.preview || []).map((s: any) => s.studentCode)));
        setActiveSessionId(res.importSession.id);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Tải lên thất bại",
        message: err.response?.data?.message || "Lỗi bóc tách dòng dữ liệu."
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
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi lưu kết quả",
        message: err.response?.data?.message || "Nhập danh sách sinh viên thất bại."
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
    } catch (err: any) {
      setDeletingImportId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: err.response?.data?.message || "Xóa phiên nhập lớp thất bại."
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
    } catch (err: any) {
      setConfirmingImportId(null);
      setNotification({
        type: "error",
        title: "Lỗi xác nhận",
        message: err.response?.data?.message || "Lỗi lưu kết quả bóc tách."
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
                    <td className="px-5 py-3.5 font-mono text-neutral-500 text-[10px]">
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
              <p className="text-[10px] text-neutral-450 uppercase font-mono tracking-wide mt-0.5">
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
                          : "border-zinc-200 hover:bg-neutral-50 text-neutral-550"
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
                    className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
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
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
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

      {/* Confirmation of Save Modal */}
      {confirmingImportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
              <h3 className="text-sm font-extrabold text-emerald-650 tracking-wide uppercase font-bold">
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

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: ROWS TAB PANE (CRUD INDIVIDUAL ROWS)
// ─────────────────────────────────────────────────────────────────────────────

interface RowsTabPaneProps {
  classId: string;
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
}

function RowsTabPane({
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
    void fetchRowsList();
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
        // Usually server requires a session. If session id is not present, we get first success/pending session or trigger error
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
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi",
        message: err.response?.data?.message || "Lưu thông tin dòng thất bại."
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
    } catch (err: any) {
      setDeletingRowId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: err.response?.data?.message || "Không thể xóa dòng bóc tách này."
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
                      <span className="text-[9px] text-neutral-450 font-mono block">MSSV: {row.student_code}</span>
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
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-550 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
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
                  onChange={(e) => setStatus(e.target.value as any)}
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
                  className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
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
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: STUDENTS TAB PANE (CRUD ACTIVE STUDENTS)
// ─────────────────────────────────────────────────────────────────────────────

interface StudentsTabPaneProps {
  classId: string;
  classesList: ClassItem[];
  allPrograms: ProgramItem[];
  refreshKey: number;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  setNotification: React.Dispatch<React.SetStateAction<{ type: "success" | "error" | "info"; title: string; message: string } | null>>;
}

function StudentsTabPane({
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
    void fetchStudentsList();
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
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi",
        message: err.response?.data?.message || "Lưu hồ sơ sinh viên thất bại."
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
    } catch (err: any) {
      setDeletingStudent(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa",
        message: err.response?.data?.message || "Không thể xóa hồ sơ sinh viên này."
      });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAllLoading(true);
    try {
      // In advisor mode, we should delete only students inside the active class to be safe and scoped
      // Wait, is there a delete all by class_id or sequentially?
      // Since backend DELETE /students deletes everything, wait:
      // Let's delete sequentially for students in this class, or call bulk deletion if available.
      // Sequentially deleting students in advisor class is much safer to avoid clearing other advisors' students!
      for (const s of data) {
        await api.delete(`/students/${s.id}`);
      }
      setNotification({ type: "success", title: "Thành công", message: `Đã xóa sạch toàn bộ sinh viên thuộc lớp.` });
      setDeleteAllOpen(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi",
        message: err.response?.data?.message || "Xóa toàn bộ sinh viên thất bại."
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
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
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
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-550 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
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
                  onChange={(e) => setStatus(e.target.value as any)}
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
                  className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
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
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
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

      {/* Delete All Confirmation Modal */}
      {deleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
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
