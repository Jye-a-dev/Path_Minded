"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Loader2,
  X,
  FileText,
  Eye,
  Trash2,
  Upload,
  AlertCircle,
  GraduationCap,
  ChevronLeft,
  CheckCircle,
  FolderOpen,
  Edit2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  XCircle,
  BookOpen
} from "lucide-react";

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
  cohort_year?: number | null;
  status: string;
  has_grades?: boolean;
  program_id?: string | null;
}

interface Advisor {
  id: string;
  full_name: string;
}

interface UploadSession {
  id: string;
  student_id: string;
  student_code?: string | null;
  student_name?: string | null;
  raw_text: string;
  source_type: "FILE" | "PASTE";
  parse_status: "PENDING" | "SUCCESS" | "FAILED";
  parse_error?: string | null;
  uploaded_at: string;
  parsed_at?: string | null;
  parsed_json?: {
    results?: ParsedResult[];
    warnings?: ParsedWarning[];
  } | null;
}

interface ParsedResult {
  schoolYear?: string;
  semesterNumber?: number;
  courseCode?: string;
  courseName?: string;
  credits?: number;
  score10?: number | null;
  score4?: number | null;
  letterGrade?: string | null;
  status?: string;
}

interface ParsedWarning {
  rowNumber?: number;
  message?: string;
  rawValue?: string;
}

interface ResultItem {
  id: string;
  student_id: string;
  course_code: string;
  course_name?: string;
  credits?: number;
  school_year?: string;
  semester_code?: string;
  semester_number?: number;
  score_10?: number;
  score_4?: number;
  letter_grade?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
  attempt_no?: number;
  is_latest?: boolean;
  student_label?: string;
}

interface CourseItem {
  course_code: string;
  course_name: string;
  credits: number | null;
  knowledge_block: string | null;
}

interface KnowledgeBlockMappingItem {
  knowledge_block: string;
  label: string;
}

export default function AdvisorTranscriptsPage() {
  const { user } = useAuth();
  
  // Base states
  const [currentAdvisor, setCurrentAdvisor] = useState<Advisor | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Selector Step
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  // Student list step
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeStatusFilter, setGradeStatusFilter] = useState("");
  const [studyStatusFilter, setStudyStatusFilter] = useState("");

  // Student Details view
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedStudentProgramId, setSelectedStudentProgramId] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "uploads">("uploads");

  // Results Tab States
  const [courseResults, setCourseResults] = useState<ResultItem[]>([]);
  const [programCourses, setProgramCourses] = useState<CourseItem[]>([]);
  const [kbMappings, setKbMappings] = useState<KnowledgeBlockMappingItem[]>([]);
  const [loadingResultsTab, setLoadingResultsTab] = useState(false);
  const [resultsSearch, setResultsSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  
  // Results checkboxed list
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [resultsFormOpen, setResultsFormOpen] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteResultId, setShowDeleteResultId] = useState<string | null>(null);

  // Uploads Tab States
  const [uploads, setUploads] = useState<UploadSession[]>([]);
  const [loadingUploadsTab, setLoadingUploadsTab] = useState(false);
  const [uploadsSearch, setUploadsSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadSession | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"results" | "json" | "raw">("results");
  const [deletingUploadId, setDeletingUploadId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Fetch initial advisor & class list
  const fetchAdvisorAndClasses = useCallback(async () => {
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
        setClasses(classesRes.data || []);
        if (classesRes.data && classesRes.data.length > 0) {
          setSelectedClassId(classesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load initial advisor and classes:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAdvisorAndClasses();
  }, [fetchAdvisorAndClasses]);

  // Load students for class once selected and confirmed
  const handleConfirmConfig = async () => {
    if (!selectedClassId) return;
    setLoadingStudents(true);
    try {
      const res = await api.get<StudentItem[]>(`/students?limit=250&class_id=${selectedClassId}`);
      setStudents(res.data || []);
      setIsConfigured(true);
    } catch (err) {
      console.error("Failed to load class students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
    setSelectedStudentId("");
    setSelectedStudent(null);
    setStudents([]);
    setSearchQuery("");
    setGradeStatusFilter("");
    setStudyStatusFilter("");
  };

  // Selection handler to open student details page
  const handleOpenStudentDetail = async (student: StudentItem, tab: "results" | "uploads") => {
    setSelectedStudentId(student.id);
    setSelectedStudent(student);
    setSelectedStudentProgramId(student.program_id || "");
    setActiveTab(tab);
    setSelectedResultIds([]);
    setResultsSearch("");
    setUploadsSearch("");
  };

  const handleBackToStudentList = async () => {
    setSelectedStudent(null);
    setSelectedStudentId("");
    setSelectedStudentProgramId("");
    // Refresh student list to update has_grades badges
    if (selectedClassId) {
      try {
        const res = await api.get<StudentItem[]>(`/students?limit=250&class_id=${selectedClassId}`);
        setStudents(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Load results and uploads when student detail opens or changes
  const fetchStudentDetailData = useCallback(async () => {
    if (!selectedStudentId) return;
    setLoadingResultsTab(true);
    setLoadingUploadsTab(true);
    try {
      // Fetch results
      const resultsRes = await api.get<ResultItem[]>(`/student_course_results?limit=1000&student_id=${selectedStudentId}`);
      setCourseResults(resultsRes.data || []);

      // Fetch uploads
      const uploadsRes = await api.get<UploadSession[]>(`/transcript_uploads?limit=100&student_id=${selectedStudentId}`);
      setUploads(uploadsRes.data || []);

      if (selectedStudentProgramId) {
        // Fetch curriculum mapping and courses
        const [mappingsRes, coursesRes] = await Promise.all([
          api.get("/knowledge_block_mappings"),
          api.get(`/curriculum_courses?limit=1000&program_id=${selectedStudentProgramId}`)
        ]);
        setKbMappings(mappingsRes.data || []);
        setProgramCourses(coursesRes.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch student data:", err);
    } finally {
      setLoadingResultsTab(false);
      setLoadingUploadsTab(false);
    }
  }, [selectedStudentId, selectedStudentProgramId, refreshKey]);

  useEffect(() => {
    void fetchStudentDetailData();
  }, [fetchStudentDetailData]);

  // Results Actions
  const handleSaveResult = async (payload: any) => {
    try {
      if (editingResult) {
        await api.patch(`/student_course_results/${editingResult.id}`, payload);
      } else {
        await api.post(`/student_course_results`, {
          ...payload,
          student_id: selectedStudentId,
          is_latest: true
        });
      }
      setResultsFormOpen(false);
      setRefreshKey((prev) => prev + 1);
      setNotification({
        type: "success",
        title: "Cập nhật thành công",
        message: "Kết quả học phần đã được cập nhật thành công."
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Cập nhật thất bại",
        message: "Cập nhật điểm học phần thất bại."
      });
    }
  };

  const handleDeleteResult = async (id: string) => {
    try {
      await api.delete(`/student_course_results/${id}`);
      setRefreshKey((prev) => prev + 1);
      setShowDeleteResultId(null);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Điểm học phần đã được xóa thành công."
      });
    } catch (err) {
      setShowDeleteResultId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa điểm",
        message: "Xóa điểm học phần thất bại."
      });
    }
  };

  const handleBulkDeleteResults = async () => {
    if (selectedResultIds.length === 0) return;
    try {
      // Call deletes sequentially or bulk endpoint if available.
      // Since bulk is supported on the backend exports, let's execute it
      await api.post(`/student_course_results/bulk-delete`, { ids: selectedResultIds });
      setSelectedResultIds([]);
      setShowBulkDeleteConfirm(false);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      // Fallback sequential
      try {
        await Promise.all(selectedResultIds.map((id) => api.delete(`/student_course_results/${id}`)));
        setSelectedResultIds([]);
        setShowBulkDeleteConfirm(false);
        setRefreshKey((prev) => prev + 1);
        setNotification({
          type: "success",
          title: "Xóa thành công",
          message: "Các kết quả học tập đã được xóa vĩnh viễn khỏi hệ thống."
        });
      } catch {
        setShowBulkDeleteConfirm(false);
        setNotification({
          type: "error",
          title: "Lỗi xóa điểm số",
          message: "Xóa nhiều điểm số thất bại."
        });
      }
    }
  };

  const handleUploadSubmit = async (payload: { textContent: string }) => {
    try {
      await api.post("/transcript_uploads", {
        student_id: selectedStudentId,
        textContent: payload.textContent
      });
      setUploadModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      setNotification({
        type: "success",
        title: "Tải lên thành công",
        message: "Bảng điểm thô đã được tải lên và phân tích thành công."
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        title: "Lỗi tải lên",
        message: err.response?.data?.message || "Tải lên bảng điểm thất bại."
      });
    }
  };

  const handleDeleteUploadSessionConfirm = async () => {
    if (!deletingUploadId) return;
    try {
      await api.delete(`/transcript_uploads/${deletingUploadId}`);
      setDeletingUploadId(null);
      setRefreshKey((prev) => prev + 1);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Phiên tải lên bảng điểm đã được xóa vĩnh viễn khỏi hệ thống."
      });
    } catch (err) {
      setDeletingUploadId(null);
      setNotification({
        type: "error",
        title: "Lỗi xóa phiên",
        message: "Xóa phiên tải lên thất bại."
      });
    }
  };

  // Mapped items
  const courseKbMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of programCourses) {
      if (c.course_code && c.knowledge_block) {
        map.set(c.course_code.toUpperCase().trim(), c.knowledge_block);
      }
    }
    return map;
  }, [programCourses]);

  const kbLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of kbMappings) {
      map.set(m.knowledge_block, m.label);
    }
    const defaults = {
      GENERAL: "Kiến thức đại cương",
      SECTOR_CORE: "Kiến thức cơ sở khối ngành",
      MAJOR_CORE: "Kiến thức cơ sở ngành",
      SPECIALIZED: "Kiến thức chuyên ngành",
    };
    Object.entries(defaults).forEach(([k, v]) => {
      if (!map.has(k)) map.set(k, v);
    });
    return map;
  }, [kbMappings]);

  // Sort Course Results by KB sequence
  const sortedCourseData = useMemo(() => {
    const ORDER = ["GENERAL", "SECTOR_CORE", "MAJOR_CORE", "SPECIALIZED"];
    return [...courseResults].sort((a, b) => {
      const codeA = (a.course_code || "").toUpperCase().trim();
      const codeB = (b.course_code || "").toUpperCase().trim();
      const kbA = courseKbMap.get(codeA) || "OTHER";
      const kbB = courseKbMap.get(codeB) || "OTHER";
      const idxA = ORDER.indexOf(kbA);
      const idxB = ORDER.indexOf(kbB);

      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
      } else if (idxA !== -1) {
        return -1;
      } else if (idxB !== -1) {
        return 1;
      } else {
        if (kbA !== kbB) return kbA.localeCompare(kbB);
      }
      return codeA.localeCompare(codeB);
    });
  }, [courseResults, courseKbMap]);

  // Unique filters data lists
  const uniqueSchoolYears = useMemo(() => {
    return Array.from(
      new Set(courseResults.map((r) => r.school_year).filter((y): y is string => !!y))
    ).sort();
  }, [courseResults]);

  const uniqueSemesters = useMemo(() => {
    return Array.from(
      new Set(courseResults.map((r) => r.semester_code).filter((s): s is string => !!s))
    ).sort();
  }, [courseResults]);

  // Filter students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || s.full_name.toLowerCase().includes(query) || s.student_code.toLowerCase().includes(query);
      
      const matchGrade = !gradeStatusFilter || 
        (gradeStatusFilter === "true" && s.has_grades) || 
        (gradeStatusFilter === "false" && !s.has_grades);

      const matchStudy = !studyStatusFilter || s.status === studyStatusFilter;

      return matchQuery && matchGrade && matchStudy;
    });
  }, [students, searchQuery, gradeStatusFilter, studyStatusFilter]);

  // Filter course results list
  const filteredCourseResults = useMemo(() => {
    return sortedCourseData.filter((r) => {
      const query = resultsSearch.toLowerCase().trim();
      const matchQuery = !query || r.course_code.toLowerCase().includes(query) || (r.course_name || "").toLowerCase().includes(query);
      const matchStatus = !filterStatus || r.status === filterStatus;
      const matchYear = !filterYear || r.school_year === filterYear;
      const matchSem = !filterSemester || r.semester_code === filterSemester;

      return matchQuery && matchStatus && matchYear && matchSem;
    });
  }, [sortedCourseData, resultsSearch, filterStatus, filterYear, filterSemester]);

  // Filter upload sessions
  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      const query = uploadsSearch.toLowerCase().trim();
      if (!query) return true;
      return u.id.toLowerCase().includes(query) || (u.parse_error || "").toLowerCase().includes(query);
    });
  }, [uploads, uploadsSearch]);

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.class_code ?? "Lớp học";

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-650" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải dữ liệu hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  // STEP 1: CLASS SELECTION SCREEN
  if (!isConfigured) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
            Quản lý Điểm &amp; Bảng điểm
          </h1>
          <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Chọn lớp học do bạn cố vấn học tập để hiển thị danh sách quản lý sinh viên.
          </p>
        </div>

        <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl space-y-6 z-10 transition-all hover:shadow-2xl hover:border-emerald-250">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Lớp học phụ trách</label>
              {classes.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-zinc-300 text-center text-xs text-neutral-400 italic">
                  Không tìm thấy lớp học nào thuộc quyền quản lý của bạn.
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer hover:border-zinc-300"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_code} {cls.class_name ? `(${cls.class_name})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            onClick={handleConfirmConfig}
            disabled={!selectedClassId || loadingStudents}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-55 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingStudents && <Loader2 size={16} className="animate-spin text-white" />}
            Xác nhận cấu hình
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: STUDENT LIST SCREEN
  if (!selectedStudentId) {
    return (
      <div className="space-y-6 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Breadcrumb Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 relative z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetConfig}
              className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2.5 text-neutral-500 hover:bg-neutral-50 hover:border-zinc-300 transition-colors cursor-pointer"
              title="Quay lại chọn lớp"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 m-0">Quản lý Bảng điểm</h1>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-150 uppercase tracking-wide">
                  Lớp: {currentClassName}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Lựa chọn một sinh viên dưới đây để xem điểm chi tiết hoặc tải tệp bảng điểm Excel lên.
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={gradeStatusFilter}
              onChange={(e) => setGradeStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer hover:border-zinc-300"
            >
              <option value="">-- Tất cả trạng thái điểm --</option>
              <option value="true">Đã có điểm</option>
              <option value="false">Chưa có điểm</option>
            </select>

            <select
              value={studyStatusFilter}
              onChange={(e) => setStudyStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer hover:border-zinc-300"
            >
              <option value="">-- Tất cả trạng thái học --</option>
              <option value="ACTIVE">Đang học</option>
              <option value="GRADUATED">Tốt nghiệp</option>
              <option value="DROPPED">Thôi học</option>
            </select>
          </div>
        </div>

        {/* Students Data list */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative z-10">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
                <GraduationCap size={26} />
              </div>
              <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy sinh viên nào</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Không tìm thấy sinh viên thỏa mãn điều kiện lọc trong lớp này.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 text-neutral-450 border-b border-zinc-200 font-bold text-[9px] uppercase tracking-wider">
                    <th className="px-5 py-3.5">Mã sinh viên</th>
                    <th className="px-5 py-3.5">Họ và tên</th>
                    <th className="px-5 py-3.5">Khóa học</th>
                    <th className="px-5 py-3.5">Trạng thái học</th>
                    <th className="px-5 py-3.5">Trạng thái điểm</th>
                    <th className="px-5 py-3.5 text-right">Thao tác quản lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors text-neutral-700 font-medium">
                      <td className="px-5 py-4 font-mono text-neutral-900 font-bold">{s.student_code}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap size={15} className="text-emerald-650" />
                          <span className="font-bold text-neutral-900">{s.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-450">{s.cohort_year ?? "N/A"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                          s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                          s.status === "GRADUATED" ? "bg-blue-50 text-blue-700 border-blue-150" : "bg-red-50 text-red-700 border-red-150"
                        }`}>
                          {s.status === "ACTIVE" ? "ĐANG HỌC" : s.status === "GRADUATED" ? "TỐT NGHIỆP" : "THÔI HỌC"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                          s.has_grades ? "bg-emerald-50 text-emerald-750 border-emerald-150" : "bg-amber-50 text-amber-600 border-amber-150"
                        }`}>
                          {s.has_grades ? (
                            <>
                              <CheckCircle size={10} className="text-emerald-700" />
                              Có điểm
                            </>
                          ) : (
                            <>
                              <XCircle size={10} className="text-amber-500" />
                              Chưa có điểm
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleOpenStudentDetail(s, "results")}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                            title="Quản lý điểm kết quả học tập"
                          >
                            <FileSpreadsheet size={12} />
                            Xem điểm số
                          </button>
                          <button
                            onClick={() => handleOpenStudentDetail(s, "uploads")}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border border-emerald-100 transition cursor-pointer"
                            title="Lịch sử/Tải bảng điểm thô"
                          >
                            <Upload size={12} />
                            Tải bảng điểm
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
      </div>
    );
  }

  // STEP 3: STUDENT DETAIL VIEW (TABS RESULTS & UPLOADS)
  const studentLabel = `${selectedStudent?.student_code} - ${selectedStudent?.full_name}`;

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Detail Header */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToStudentList}
            className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 text-neutral-700 transition cursor-pointer shrink-0"
            title="Quay lại danh sách sinh viên"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-950 m-0">
                {selectedStudent?.full_name}
              </h1>
              <span className="font-mono text-xs font-bold bg-neutral-100 text-neutral-550 border border-zinc-200 px-2 py-0.5 rounded uppercase">
                {selectedStudent?.student_code}
              </span>
            </div>
            <p className="text-xs text-neutral-450 font-bold mt-1 font-mono">
              Lớp: {currentClassName} | Cố vấn: {currentAdvisor?.full_name}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-neutral-100 border border-zinc-200 rounded-xl p-1 shrink-0 font-bold">
          <button
            onClick={() => setActiveTab("results")}
            className={`px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === "results"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Bảng điểm chi tiết
          </button>
          <button
            onClick={() => setActiveTab("uploads")}
            className={`px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
              activeTab === "uploads"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Lịch sử tải bảng điểm
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENT RESULTS DISPLAY */}
      {activeTab === "results" && (
        <div className="space-y-4 relative z-10">
          {/* Results Filters & Actions */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-450" />
              <input
                type="text"
                placeholder="Lọc mã hoặc tên học phần..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-neutral-55 px-3 py-2 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="">-- Tất cả trạng thái --</option>
                <option value="PASSED">Đạt (PASSED)</option>
                <option value="FAILED">Rớt (FAILED)</option>
                <option value="STUDYING">Đang học (STUDYING)</option>
              </select>

              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-neutral-55 px-3 py-2 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="">-- Tất cả năm học --</option>
                {uniqueSchoolYears.map((y) => (
                  <option key={y} value={y}>Năm học {y}</option>
                ))}
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-neutral-55 px-3 py-2 text-xs font-semibold text-neutral-700 cursor-pointer"
              >
                <option value="">-- Tất cả học kỳ --</option>
                {uniqueSemesters.map((s) => (
                  <option key={s} value={s}>Học kỳ {s}</option>
                ))}
              </select>

              <div className="h-6 w-px bg-zinc-200 hidden md:block" />

              {selectedResultIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-150 px-3.5 py-2 text-xs font-bold text-rose-650 shadow-sm transition hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 size={12} />
                  Xóa đã chọn ({selectedResultIds.length})
                </button>
              )}

              <button
                onClick={() => {
                  setEditingResult(null);
                  setResultsFormOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 cursor-pointer"
              >
                <Plus size={12} />
                Tạo kết quả
              </button>
            </div>
          </div>

          {/* Results table */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {loadingResultsTab ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 text-xs">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                Đang tải dữ liệu điểm...
              </div>
            ) : filteredCourseResults.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-300">
                  <BookOpen size={22} />
                </div>
                <p className="text-xs text-neutral-450 italic font-semibold">Chưa có kết quả điểm học phần nào khớp bộ lọc.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-neutral-450 border-b border-zinc-200 font-bold text-[9px] uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedResultIds.length === filteredCourseResults.length && filteredCourseResults.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResultIds(filteredCourseResults.map((r) => r.id));
                            } else {
                              setSelectedResultIds([]);
                            }
                          }}
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-neutral-50"
                        />
                      </th>
                      <th className="px-5 py-3.5">Môn học</th>
                      <th className="px-5 py-3.5">Tín chỉ</th>
                      <th className="px-5 py-3.5">Khối kiến thức</th>
                      <th className="px-5 py-3.5">Học kỳ / Năm học</th>
                      <th className="px-5 py-3.5">Điểm số (Chữ/10/4)</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-neutral-700 font-medium">
                    {filteredCourseResults.map((row) => {
                      const code = (row.course_code || "").toUpperCase().trim();
                      const kb = courseKbMap.get(code);
                      const label = kb ? (kbLabelMap.get(kb) || kb) : "Chưa phân loại";

                      const kbColors: Record<string, string> = {
                        GENERAL: "bg-indigo-50 text-indigo-700 border-indigo-100",
                        SECTOR_CORE: "bg-teal-50 text-teal-700 border-teal-100",
                        MAJOR_CORE: "bg-purple-50 text-purple-700 border-purple-100",
                        SPECIALIZED: "bg-pink-50 text-pink-700 border-pink-100",
                      };
                      const colorClass = kb ? (kbColors[kb] || "bg-zinc-100 text-zinc-650 border-zinc-200") : "bg-neutral-50 text-neutral-450 border-zinc-150";

                      return (
                        <tr key={row.id} className="hover:bg-neutral-50/20">
                          <td className="px-5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedResultIds.includes(row.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedResultIds([...selectedResultIds, row.id]);
                                } else {
                                  setSelectedResultIds(selectedResultIds.filter((id) => id !== row.id));
                                }
                              }}
                              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-neutral-50"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-mono text-xs font-bold text-neutral-900 block">{row.course_code}</span>
                            <span className="text-[10px] text-neutral-400 max-w-50 truncate block" title={row.course_name || ""}>
                              {row.course_name || "Không có tên môn"}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-neutral-500">{row.credits ?? "—"}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${colorClass}`}>
                              {label}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-neutral-500 text-[10px]">
                            {row.semester_code || "—"} ({row.school_year || "—"})
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-neutral-900 font-mono text-xs">{row.letter_grade || "—"}</span>
                            <span className="text-neutral-400 font-mono text-[10px] ml-1.5">({row.score_10 ?? "—"} / {row.score_4 ?? "—"})</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                              row.status === "PASSED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              row.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-blue-50 text-blue-750 border-blue-100"
                            }`}>
                              {row.status === "PASSED" ? "ĐẠT" : row.status === "FAILED" ? "TRƯỢT" : "ĐANG HỌC"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => {
                                  setEditingResult(row);
                                  setResultsFormOpen(true);
                                }}
                                className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                                title="Sửa điểm số"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => setShowDeleteResultId(row.id)}
                                className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-red-200 hover:text-rose-600 transition cursor-pointer"
                                title="Xóa điểm số"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSCRIPT UPLOAD HISTORY DISPLAY */}
      {activeTab === "uploads" && (
        <div className="space-y-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-450" />
              <input
                type="text"
                placeholder="Lọc phiên tải lên..."
                value={uploadsSearch}
                onChange={(e) => setUploadsSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 cursor-pointer shrink-0"
            >
              <Plus size={12} />
              Tải bảng điểm mới
            </button>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {loadingUploadsTab ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 text-xs">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                Đang tải lịch sử phiên...
              </div>
            ) : filteredUploads.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
                  <FileSpreadsheet size={26} />
                </div>
                <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy phiên nào</h3>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Chưa có phiên tải lên bảng điểm nào của sinh viên này được lưu trong hệ thống.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 text-neutral-450 border-b border-zinc-200 font-bold text-[9px] uppercase tracking-wider">
                      <th className="px-5 py-3.5">Phiên tải lên</th>
                      <th className="px-5 py-3.5">Nguồn dữ liệu</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5">Thời gian</th>
                      <th className="px-5 py-3.5">Cảnh báo lỗi</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-neutral-700 font-medium">
                    {filteredUploads.map((row) => (
                      <tr key={row.id} className="hover:bg-neutral-50/20">
                        <td className="px-5 py-3.5">
                          <span className="text-neutral-900 block font-bold truncate max-w-xs font-mono">{row.id}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-bold text-neutral-600 border border-zinc-200 uppercase tracking-wide">
                            {row.source_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold border uppercase tracking-wide ${
                            row.parse_status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                            row.parse_status === "FAILED" ? "bg-red-50 text-red-700 border-red-150" : "bg-amber-50 text-amber-600 border-amber-150"
                          }`}>
                            {row.parse_status === "SUCCESS" ? "THÀNH CÔNG" : row.parse_status === "FAILED" ? "THẤT BẠI" : "CHỜ XỬ LÝ"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-neutral-500 text-[10px]">
                          Tải lên: {new Date(row.uploaded_at).toLocaleString("vi-VN")}
                          {row.parsed_at && (
                            <div className="text-emerald-700 font-bold mt-0.5">
                              Xử lý: {new Date(row.parsed_at).toLocaleString("vi-VN")}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-red-500 max-w-xs truncate text-[10px]" title={row.parse_error || ""}>
                          {row.parse_error || <span className="text-neutral-300 font-normal">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                setSelectedUpload(row);
                                setDetailTab("results");
                                setDetailModalOpen(true);
                              }}
                              className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                              title="Xem chi tiết phiên"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => setDeletingUploadId(row.id)}
                              className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-red-200 hover:text-rose-600 transition cursor-pointer"
                              title="Xóa phiên tải lên"
                            >
                              <Trash2 size={12} />
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
        </div>
      )}

      {/* MODAL: UPLOAD NEW TRANSCRIPT FOR STUDENT */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="p-6 border-b border-zinc-150">
              <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
                Tải lên bảng điểm sinh viên
              </h3>
              <p className="text-xs text-neutral-550 mt-1 font-bold">
                Mục tiêu: {studentLabel}
              </p>
            </div>

            <TranscriptPasteForm
              studentId={selectedStudentId}
              onSubmit={handleUploadSubmit}
              onCancel={() => setUploadModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL: VIEW UPLOAD SESSION DETAIL */}
      {detailModalOpen && selectedUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-neutral-900">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="p-6 border-b border-zinc-150 shrink-0">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <GraduationCap className="text-emerald-650" size={22} />
                Chi tiết kết quả bóc tách phiên
              </h3>
              <p className="text-xs text-neutral-450 mt-1 font-mono">
                Phiên: {selectedUpload.id} — Tải lên vào {new Date(selectedUpload.uploaded_at).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {selectedUpload.parsed_json?.warnings && selectedUpload.parsed_json.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-250 space-y-2">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                    <AlertCircle size={14} /> Cảnh báo bóc tách ({selectedUpload.parsed_json.warnings.length})
                  </span>
                  <div className="text-[10px] text-amber-700 divide-y divide-amber-100 max-h-24 overflow-y-auto font-medium">
                    {selectedUpload.parsed_json.warnings.map((w, idx) => (
                      <p key={idx} className="py-1">
                        Dòng {w.rowNumber || "?"}: {w.message} {w.rawValue ? `(Giá trị: "${w.rawValue}")` : ""}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex border-b border-zinc-200 gap-2 shrink-0 font-bold">
                <button
                  onClick={() => setDetailTab("results")}
                  className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                    detailTab === "results"
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Kết quả môn học
                </button>
                <button
                  onClick={() => setDetailTab("json")}
                  className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                    detailTab === "json"
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Dữ liệu JSON phân tích
                </button>
                <button
                  onClick={() => setDetailTab("raw")}
                  className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                    detailTab === "raw"
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  Văn bản thô
                </button>
              </div>

              <div className="min-h-60 flex-1">
                {detailTab === "results" && (
                  <div className="space-y-4">
                    {selectedUpload.parse_error && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-mono">
                        <strong>Lỗi phân tích:</strong> {selectedUpload.parse_error}
                      </div>
                    )}

                    {!selectedUpload.parsed_json?.results || selectedUpload.parsed_json.results.length === 0 ? (
                      <div className="text-center py-10 text-neutral-450 text-xs font-semibold bg-neutral-50/50 rounded-xl">
                        Không có kết quả môn học nào được tìm thấy hoặc phiên bóc tách lỗi.
                      </div>
                    ) : (
                      <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-neutral-400 font-bold text-[9px] uppercase tracking-wider">
                              <th className="px-4 py-2.5">Học kỳ</th>
                              <th className="px-4 py-2.5">Mã môn</th>
                              <th className="px-4 py-2.5">Tên học phần</th>
                              <th className="px-4 py-2.5 text-center">Tín chỉ</th>
                              <th className="px-4 py-2.5 text-center">Hệ 10</th>
                              <th className="px-4 py-2.5 text-center">Hệ 4</th>
                              <th className="px-4 py-2.5 text-center">Điểm chữ</th>
                              <th className="px-4 py-2.5">Kết quả</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-neutral-700 font-medium">
                            {selectedUpload.parsed_json.results.map((res, idx) => (
                              <tr key={idx} className="hover:bg-neutral-50/20">
                                <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-450">
                                  {res.schoolYear === "Bảo lưu" ? (
                                    <span className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-600 border border-zinc-200">Bảo lưu</span>
                                  ) : (
                                    `${res.schoolYear} - HK${res.semesterNumber}`
                                  )}
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-neutral-900">{res.courseCode}</td>
                                <td className="px-4 py-2.5 truncate max-w-[150px]">{res.courseName || "—"}</td>
                                <td className="px-4 py-2.5 text-center font-mono">{res.credits ?? 0}</td>
                                <td className="px-4 py-2.5 text-center font-mono">{res.score10 !== null && res.score10 !== undefined ? res.score10 : "—"}</td>
                                <td className="px-4 py-2.5 text-center font-mono">{res.score4 !== null && res.score4 !== undefined ? res.score4 : "—"}</td>
                                <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-700">{res.letterGrade || "—"}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                                    res.status === "PASSED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    res.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-neutral-100 text-neutral-450"
                                  }`}>
                                    {res.status === "PASSED" ? "ĐẠT" : res.status === "FAILED" ? "TRƯỢT" : "ĐANG HỌC"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {detailTab === "json" && (
                  <pre className="bg-neutral-50 p-4 rounded-xl text-xs overflow-auto font-mono text-emerald-800 max-h-96 border border-zinc-200">
                    {JSON.stringify(selectedUpload.parsed_json || { message: "Không có dữ liệu JSON" }, null, 2)}
                  </pre>
                )}

                {detailTab === "raw" && (
                  <pre className="bg-neutral-50 p-4 rounded-xl text-xs overflow-auto font-mono text-neutral-700 max-h-96 whitespace-pre-wrap border border-zinc-200 leading-relaxed font-semibold">
                    {selectedUpload.raw_text}
                  </pre>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-neutral-100 hover:bg-neutral-200 px-4 py-2 text-xs font-bold text-neutral-750 transition cursor-pointer"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT INDIVIDUAL COURSE RESULT */}
      {resultsFormOpen && (
        <StudentCourseResultInlineForm
          editingItem={editingResult}
          studentLabel={studentLabel}
          onSave={handleSaveResult}
          onCancel={() => setResultsFormOpen(false)}
        />
      )}

      {/* DELETE DIALOGS */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4 max-w-sm">
            <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide">Xóa nhiều điểm số đã chọn</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn xóa vĩnh viễn {selectedResultIds.length} kết quả học tập đã chọn không? Điểm số bị xóa sẽ mất vĩnh viễn khỏi hệ thống.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="rounded-lg border border-zinc-200 hover:bg-neutral-55 px-3 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteResults}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteResultId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xl space-y-4 max-w-sm">
            <h4 className="text-sm font-black text-rose-600 uppercase tracking-wide font-bold">Xóa điểm học phần</h4>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn xóa vĩnh viễn điểm số này của sinh viên không? Thao tác này không thể khôi phục lại.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteResultId(null)}
                className="rounded-lg border border-zinc-200 hover:bg-neutral-55 px-3 py-1.5 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteResult(showDeleteResultId)}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingUploadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
              <h3 className="text-sm font-extrabold text-rose-600 tracking-wide uppercase font-bold">
                Xóa phiên tải lên
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa phiên này? Tất cả các điểm học phần trong phiên này cũng sẽ bị xóa. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDeletingUploadId(null)}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUploadSessionConfirm}
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
                <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
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

// Subcomponent: TRANSCRIPT UPLOAD FILE/PASTE FORM
interface TranscriptPasteFormProps {
  studentId: string;
  onSubmit: (payload: { textContent: string }) => Promise<void>;
  onCancel: () => void;
}

function TranscriptPasteForm({
  onSubmit,
  onCancel
}: TranscriptPasteFormProps) {
  const [textContent, setTextContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      setErrorMsg("Vui lòng dán văn bản bảng điểm thô.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSubmit({ textContent });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Tải lên thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-neutral-900 font-semibold text-xs">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-2 font-medium">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block flex justify-between">
          <span>Nội dung văn bản bảng điểm thô</span>
          <span className="text-neutral-400 lowercase font-medium">Sao chép từ Portal VLU</span>
        </label>
        <textarea
          placeholder="Ví dụ:&#10;1&#71;ENG010012&#9;Anh văn dự bị (AV0)&#9;2&#9;&#9;&#9;MT&#10;1&#9;71ENG010000&#9;Kiểm tra tiếng Anh&#9;0&#9;8&#9;3.20&#9;B+"
          rows={6}
          required
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none h-44 font-semibold text-neutral-800"
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
        >
          {submitting && <Loader2 size={12} className="animate-spin text-white" />}
          Phân tích bảng điểm
        </button>
      </div>
    </form>
  );
}

// Subcomponent: INDIVIDUAL GRADE RESULT CREATE/EDIT FORM
interface StudentCourseResultInlineFormProps {
  editingItem: ResultItem | null;
  studentLabel: string;
  onSave: (payload: any) => Promise<void>;
  onCancel: () => void;
}

function StudentCourseResultInlineForm({
  editingItem,
  studentLabel,
  onSave,
  onCancel
}: StudentCourseResultInlineFormProps) {
  const [courseCode, setCourseCode] = useState(editingItem?.course_code || "");
  const [courseName, setCourseName] = useState(editingItem?.course_name || "");
  const [credits, setCredits] = useState<string>(editingItem?.credits?.toString() || "");
  const [schoolYear, setSchoolYear] = useState(editingItem?.school_year || "");
  const [semesterCode, setSemesterCode] = useState(editingItem?.semester_code || "");
  const [semesterNumber, setSemesterNumber] = useState<string>(editingItem?.semester_number?.toString() || "");
  const [score10, setScore10] = useState<string>(editingItem?.score_10?.toString() || "");
  const [score4, setScore4] = useState<string>(editingItem?.score_4?.toString() || "");
  const [letterGrade, setLetterGrade] = useState(editingItem?.letter_grade || "");
  const [status, setStatus] = useState<"PASSED" | "FAILED" | "STUDYING">(editingItem?.status || "PASSED");
  const [attemptNo, setAttemptNo] = useState<string>(editingItem?.attempt_no?.toString() || "1");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleScore10Change = (val: string) => {
    setScore10(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      if (num >= 4.0) {
        setStatus("PASSED");
      } else {
        setStatus("FAILED");
      }

      if (num >= 9.0) {
        setLetterGrade("A+");
        setScore4("4.0");
      } else if (num >= 8.5) {
        setLetterGrade("A");
        setScore4("4.0");
      } else if (num >= 8.0) {
        setLetterGrade("B+");
        setScore4("3.5");
      } else if (num >= 7.0) {
        setLetterGrade("B");
        setScore4("3.0");
      } else if (num >= 6.5) {
        setLetterGrade("C+");
        setScore4("2.5");
      } else if (num >= 5.5) {
        setLetterGrade("C");
        setScore4("2.0");
      } else if (num >= 5.0) {
        setLetterGrade("D+");
        setScore4("1.5");
      } else if (num >= 4.0) {
        setLetterGrade("D");
        setScore4("1.0");
      } else {
        setLetterGrade("F");
        setScore4("0.0");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) {
      setErrorMsg("Mã môn học không được bỏ trống.");
      return;
    }

    const parsedCredits = credits.trim() !== "" ? parseInt(credits) : null;
    const parsedSemNum = semesterNumber.trim() !== "" ? parseInt(semesterNumber) : null;
    const parsedScore10 = score10.trim() !== "" ? parseFloat(score10) : null;
    const parsedScore4 = score4.trim() !== "" ? parseFloat(score4) : null;
    const parsedAttempt = attemptNo.trim() !== "" ? parseInt(attemptNo) : 1;

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSave({
        course_code: courseCode.trim().toUpperCase(),
        course_name: courseName.trim() || null,
        credits: parsedCredits,
        school_year: schoolYear.trim() || null,
        semester_code: semesterCode.trim() || null,
        semester_number: parsedSemNum,
        score_10: status === "STUDYING" ? null : parsedScore10,
        score_4: status === "STUDYING" ? null : parsedScore4,
        letter_grade: status === "STUDYING" ? null : letterGrade.trim().toUpperCase() || null,
        status,
        attempt_no: parsedAttempt,
        is_latest: true
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || "Lưu kết quả học phần thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 flex flex-col max-h-[90vh]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="p-6 border-b border-zinc-150 shrink-0">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            {editingItem ? "Chỉnh sửa điểm số môn học" : "Tạo kết quả học tập mới"}
          </h3>
          <p className="text-xs text-neutral-450 mt-1 font-bold">
            Mục tiêu: {studentLabel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto pr-2 flex-1 pb-2 font-semibold text-xs text-neutral-600">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Mã học phần *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: ENG0101"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 uppercase font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Tên học phần</label>
              <input
                type="text"
                placeholder="Ví dụ: Anh văn giao tiếp"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Tín chỉ</label>
              <input
                type="number"
                placeholder="3"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">HK Số</label>
              <input
                type="number"
                placeholder="2"
                value={semesterNumber}
                onChange={(e) => setSemesterNumber(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Mã học kỳ (Niên chế)</label>
              <input
                type="text"
                placeholder="Ví dụ: HK2"
                value={semesterCode}
                onChange={(e) => setSemesterCode(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Năm học (Niên chế)</label>
              <input
                type="text"
                placeholder="Ví dụ: 2023-2024"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Lần học thứ</label>
              <input
                type="number"
                min="1"
                value={attemptNo}
                onChange={(e) => setAttemptNo(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Trạng thái đạt</label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value as "PASSED" | "FAILED" | "STUDYING";
                setStatus(newStatus);
                if (newStatus === "STUDYING") {
                  setScore10("");
                  setScore4("");
                  setLetterGrade("");
                }
              }}
              className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-850 bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="PASSED">ĐẠT (PASSED)</option>
              <option value="FAILED">TRƯỢT (FAILED)</option>
              <option value="STUDYING">ĐANG HỌC (STUDYING)</option>
            </select>
          </div>

          {status !== "STUDYING" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Hệ 10</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="8.5"
                  value={score10}
                  onChange={(e) => handleScore10Change(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm text-neutral-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Hệ 4</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  placeholder="3.5"
                  value={score4}
                  onChange={(e) => setScore4(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm text-neutral-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">Điểm chữ</label>
                <input
                  type="text"
                  placeholder="B+"
                  value={letterGrade}
                  onChange={(e) => setLetterGrade(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-2 py-2 text-sm text-neutral-800 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin text-white" />}
              {editingItem ? "Lưu thay đổi" : "Tạo điểm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
