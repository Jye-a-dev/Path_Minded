"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import { Loader2, ArrowLeft } from "lucide-react";

import ClassConfigurator, { ClassItem } from "./components/ClassConfigurator";
import StudentListTab from "./components/StudentListTab";
import StudentResultsTab, { ResultItem } from "./components/StudentResultsTab";
import TranscriptUploadsTab from "./components/TranscriptUploadsTab";
import TranscriptPasteModal from "./components/TranscriptPasteModal";
import StudentCourseResultInlineModal from "./components/StudentCourseResultInlineModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import NotificationModal, { NotificationItem } from "./components/NotificationModal";
import UploadDetailModal from "./components/UploadDetailModal";

export interface StudentItem {
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

export interface UploadSession {
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

export interface ParsedResult {
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

export interface ParsedWarning {
  rowNumber?: number;
  message?: string;
  rawValue?: string;
}

export interface CourseItem {
  course_code: string;
  course_name: string;
  credits: number | null;
  knowledge_block: string | null;
}

export interface KnowledgeBlockMappingItem {
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
  const [selectedClassId, setSelectedClassId] = useReloadPersistentState("advisor_transcripts_selectedClassId", "");
  const [isConfigured, setIsConfigured] = useReloadPersistentState("advisor_transcripts_isConfigured", false);

  // Student list step
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Student Details view
  const [selectedStudentId, setSelectedStudentId] = useReloadPersistentState("advisor_transcripts_selectedStudentId", "");
  const [selectedStudent, setSelectedStudent] = useReloadPersistentState<StudentItem | null>("advisor_transcripts_selectedStudent", null);
  const [selectedStudentProgramId, setSelectedStudentProgramId] = useReloadPersistentState("advisor_transcripts_selectedStudentProgramId", "");
  const [activeTab, setActiveTab] = useReloadPersistentState<"results" | "uploads">("advisor_transcripts_activeTab", "uploads");

  // Fetch student list automatically on mount if restored from reload persistence
  useEffect(() => {
    if (isConfigured && selectedClassId) {
      const loadStudents = async () => {
        setLoadingStudents(true);
        try {
          const res = await api.get<StudentItem[]>(`/students?limit=250&class_id=${selectedClassId}`);
          setStudents(res.data || []);
        } catch (err) {
          console.error("Failed to load class students:", err);
        } finally {
          setLoadingStudents(false);
        }
      };
      void loadStudents();
    }
  }, [isConfigured, selectedClassId]);

  // Results Tab States
  const [courseResults, setCourseResults] = useState<ResultItem[]>([]);
  const [programCourses, setProgramCourses] = useState<CourseItem[]>([]);
  const [kbMappings, setKbMappings] = useState<KnowledgeBlockMappingItem[]>([]);
  const [loadingResultsTab, setLoadingResultsTab] = useState(false);

  // Results checkboxed list
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [resultsFormOpen, setResultsFormOpen] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDeleteResultId, setShowDeleteResultId] = useState<string | null>(null);

  // Uploads Tab States
  const [uploads, setUploads] = useState<UploadSession[]>([]);
  const [loadingUploadsTab, setLoadingUploadsTab] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadSession | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deletingUploadId, setDeletingUploadId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(null);

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
          setSelectedClassId((prev) => prev || classesRes.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load initial advisor and classes:", err);
    } finally {
      setLoading(false);
    }
  }, [user, setSelectedClassId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAdvisorAndClasses();
    }, 0);
    return () => clearTimeout(timer);
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
  };

  // Selection handler to open student details page
  const handleOpenStudentDetail = async (student: StudentItem, tab: "results" | "uploads") => {
    setSelectedStudentId(student.id);
    setSelectedStudent(student);
    setSelectedStudentProgramId(student.program_id || "");
    setActiveTab(tab);
    setSelectedResultIds([]);
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
      const resultsRes = await api.get<ResultItem[]>(`/student_course_results?limit=1000&student_id=${selectedStudentId}`);
      setCourseResults(resultsRes.data || []);

      const uploadsRes = await api.get<UploadSession[]>(`/transcript_uploads?limit=100&student_id=${selectedStudentId}`);
      setUploads(uploadsRes.data || []);

      if (selectedStudentProgramId) {
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
  }, [selectedStudentId, selectedStudentProgramId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStudentDetailData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStudentDetailData, refreshKey]);

  // Results Actions
  const handleSaveResult = async (payload: {
    course_code: string;
    course_name: string | null;
    credits: number | null;
    score_10: number | null;
    score_4: number | null;
    letter_grade: string | null;
    status: "PASSED" | "FAILED" | "STUDYING";
    school_year: string | null;
    semester_code: string | null;
    semester_number: number | null;
    attempt_no?: number;
    is_latest?: boolean;
  }) => {
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
  };

  const handleDeleteResult = async () => {
    if (!showDeleteResultId) return;
    try {
      await api.delete(`/student_course_results/${showDeleteResultId}`);
      setRefreshKey((prev) => prev + 1);
      setShowDeleteResultId(null);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Điểm học phần đã được xóa thành công."
      });
    } catch {
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
      await api.post(`/student_course_results/bulk-delete`, { ids: selectedResultIds });
      setSelectedResultIds([]);
      setShowBulkDeleteConfirm(false);
      setRefreshKey((prev) => prev + 1);
      setNotification({
        type: "success",
        title: "Xóa thành công",
        message: "Các kết quả học tập đã được xóa vĩnh viễn khỏi hệ thống."
      });
    } catch {
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
    await api.post("/transcript_uploads", {
      student_id: selectedStudentId,
      textContent: payload.textContent
    });
    setUploadModalOpen(false);
    setRefreshKey((prev) => prev + 1);
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
    } catch {
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

  const currentClassName = classes.find((c) => c.id === selectedClassId)?.class_code ?? "Lớp học";

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-655" />
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
      <ClassConfigurator
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        loadingStudents={loadingStudents}
        onConfirmConfig={handleConfirmConfig}
      />
    );
  }

  // STEP 2: STUDENT LIST SCREEN
  if (!selectedStudentId) {
    return (
      <StudentListTab
        students={students}
        currentClassName={currentClassName}
        onBackToClassSelect={handleResetConfig}
        onOpenStudentDetail={handleOpenStudentDetail}
      />
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
            className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-55 text-neutral-700 transition cursor-pointer shrink-0"
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
                : "text-neutral-505 hover:text-neutral-700"
            }`}
          >
            Lịch sử tải bảng điểm
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENT RESULTS DISPLAY */}
      {activeTab === "results" && (
        <StudentResultsTab
          courseResults={courseResults}
          courseKbMap={courseKbMap}
          kbLabelMap={kbLabelMap}
          loadingResultsTab={loadingResultsTab}
          selectedResultIds={selectedResultIds}
          setSelectedResultIds={setSelectedResultIds}
          onEditResult={(row) => {
            setEditingResult(row);
            setResultsFormOpen(true);
          }}
          onDeleteResult={(id) => setShowDeleteResultId(id)}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)}
          onCreateResult={() => {
            setEditingResult(null);
            setResultsFormOpen(true);
          }}
        />
      )}

      {/* TAB 2: TRANSCRIPT UPLOAD HISTORY DISPLAY */}
      {activeTab === "uploads" && (
        <TranscriptUploadsTab
          uploads={uploads}
          loadingUploadsTab={loadingUploadsTab}
          onViewDetail={(row) => {
            setSelectedUpload(row);
            setDetailModalOpen(true);
          }}
          onDeleteUpload={(id) => setDeletingUploadId(id)}
          onNewUpload={() => setUploadModalOpen(true)}
        />
      )}

      {/* MODAL: UPLOAD NEW TRANSCRIPT FOR STUDENT */}
      <TranscriptPasteModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleUploadSubmit}
        studentLabel={studentLabel}
      />

      {/* MODAL: VIEW UPLOAD SESSION DETAIL */}
      <UploadDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        selectedUpload={selectedUpload}
      />

      {/* MODAL: EDIT INDIVIDUAL COURSE RESULT */}
      {resultsFormOpen && (
        <StudentCourseResultInlineModal
          editingItem={editingResult}
          studentLabel={studentLabel}
          onSave={handleSaveResult}
          onCancel={() => setResultsFormOpen(false)}
        />
      )}

      {/* DELETE DIALOGS */}
      <DeleteConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteResults}
        title="Xóa nhiều điểm số đã chọn"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedResultIds.length} kết quả học tập đã chọn không? Điểm số bị xóa sẽ mất vĩnh viễn khỏi hệ thống.`}
      />

      <DeleteConfirmModal
        isOpen={!!showDeleteResultId}
        onClose={() => setShowDeleteResultId(null)}
        onConfirm={handleDeleteResult}
        title="Xóa điểm học phần"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn điểm số này của sinh viên không? Thao tác này không thể khôi phục lại."
      />

      <DeleteConfirmModal
        isOpen={!!deletingUploadId}
        onClose={() => setDeletingUploadId(null)}
        onConfirm={handleDeleteUploadSessionConfirm}
        title="Xóa phiên tải lên"
        message="Bạn có chắc chắn muốn xóa phiên này? Tất cả các điểm học phần trong phiên này cũng sẽ bị xóa. Hành động này không thể hoàn tác."
      />

      {/* Notification Modal */}
      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
