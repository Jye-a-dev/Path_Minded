import React, { useState, useEffect } from "react";
import { useStudents } from "../../../hooks/useStudents";
import type { StudentItem } from "../../../hooks/useStudents";
import { StudentResultsTab } from "./components/StudentResultsTab";
import { TranscriptUploadsTab } from "./components/TranscriptUploadsTab";
import { DataTable } from "../../../components/data_display/DataTable";
import { api } from "../../../services/api";
import {
  GraduationCap,
  Loader2,
  ChevronLeft,
  FileSpreadsheet,
  FileUp,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  Layers,
  BookOpen
} from "lucide-react";

interface ProgramItem {
  id: string;
  program_name: string;
  major_name?: string;
}

interface ClassItem {
  id: string;
  class_code: string;
}

interface StudentResultsAndTranscriptsProps {
  initialTab?: "results" | "uploads";
}

export default function StudentResultsAndTranscripts({
  initialTab = "results",
}: StudentResultsAndTranscriptsProps) {
  // Hooks for fetching
  const studentsHook = useStudents();

  // Setup screen states
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  
  // Student detail state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedStudentProgramId, setSelectedStudentProgramId] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "uploads">(initialTab);

  // Lists for dropdown selectors
  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Student list filter states
  const [gradeStatusFilter, setGradeStatusFilter] = useState<string>("");
  const [studyStatusFilter, setStudyStatusFilter] = useState<string>("");

  // Load programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  // Load classes when major changes
  useEffect(() => {
    if (!selectedMajor) return;
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<ClassItem[]>(`/classes?limit=100&program_id=${p.id}`)
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesList(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    void fetchClasses();
  }, [selectedMajor, allPrograms]);

  // Sync Student Hooks when class selection confirmed
  const handleConfirmConfig = () => {
    if (selectedClassId) {
      studentsHook.updateFilters({
        class_id: selectedClassId,
        status: studyStatusFilter || undefined,
        has_grades: gradeStatusFilter || undefined,
      });
      setIsConfigured(true);
    }
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
    setSelectedClassId("");
    setSelectedStudentId("");
    setSelectedStudent(null);
    setClassesList([]);
    setGradeStatusFilter("");
    setStudyStatusFilter("");
    studentsHook.updateFilters({ class_id: undefined, status: undefined, has_grades: undefined });
  };

  // Sync student filter in hook when dropdowns change (if configured)
  const handleStudentGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGradeStatusFilter(val);
    if (isConfigured) {
      studentsHook.updateFilters({ has_grades: val || undefined });
    }
  };

  const handleStudentStudyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStudyStatusFilter(val);
    if (isConfigured) {
      studentsHook.updateFilters({ status: val || undefined });
    }
  };

  // Selection handler to open detail view
  const handleOpenStudentDetail = (student: StudentItem, tab: "results" | "uploads") => {
    setSelectedStudent(student);
    setSelectedStudentProgramId(student.program_id || "");
    setSelectedStudentId(student.id);
    setActiveTab(tab);
  };

  const handleBackToStudentList = () => {
    setSelectedStudent(null);
    setSelectedStudentId("");
    setSelectedStudentProgramId("");
    // Refresh student list to update has_grades status badge
    void studentsHook.refresh();
  };

  // Callback to refresh the student detail presence info or lists
  const handleRefreshStudentData = async () => {
    if (!selectedStudentId) return;
    try {
      const response = await api.get<StudentItem>(`/students/${selectedStudentId}`);
      if (response.data) {
        setSelectedStudent(response.data);
      }
    } catch (err) {
      console.error("Failed to refresh student detail status:", err);
    }
  };

  // Config View
  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <GraduationCap className="text-indigo-400! h-8 w-8" />
            Kết quả học tập &amp; Bảng điểm
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình chuyên ngành và lớp học để hiển thị danh sách sinh viên.
          </p>
        </div>

        {loadingPrograms ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            Đang tải dữ liệu cấu hình hệ thống...
          </div>
        ) : (
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur-md space-y-6">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl" />

            <div className="space-y-4">
              {/* Major Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyên ngành</label>
                <select
                  value={selectedMajor}
                  onChange={(e) => {
                    setSelectedMajor(e.target.value);
                    setSelectedClassId("");
                  }}
                  className="w-full rounded-xl border border-slate-805 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                >
                  <option className="bg-slate-900 text-slate-550" value="">-- Chọn chuyên ngành --</option>
                  {uniqueMajors.map((major) => (
                    <option className="bg-slate-900 text-slate-100" key={major} value={major}>{major}</option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học</label>
                {loadingClasses ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-955/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách lớp...
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    disabled={!selectedMajor || classesList.length === 0}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-550" value="">
                      {!selectedMajor
                        ? "-- Vui lòng chọn chuyên ngành trước --"
                        : classesList.length === 0
                        ? "-- Không tìm thấy lớp học nào --"
                        : "-- Chọn lớp học --"}
                    </option>
                    {classesList.map((c) => (
                      <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                        {c.class_code}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmConfig}
              disabled={!selectedClassId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận cấu hình
            </button>
          </div>
        )}
      </div>
    );
  }

  // Header meta information for breadcrumbs and title
  const currentClassName = classesList.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;

  // Student Table columns configuration
  const studentTableColumns = [
    {
      header: "Mã sinh viên",
      accessorKey: "student_code",
      render: (row: StudentItem) => (
        <span className="font-mono text-xs font-bold text-slate-200 block">
          {row.student_code}
        </span>
      ),
    },
    {
      header: "Họ và tên",
      accessorKey: "full_name",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-indigo-400" />
          <span className="text-slate-255 font-bold hover:text-indigo-400 transition-colors">
            {row.full_name}
          </span>
        </div>
      ),
    },
    {
      header: "Khóa học",
      accessorKey: "cohort_year",
      render: (row: StudentItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      render: (row: StudentItem) => {
        const badges = {
          ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          GRADUATED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          DROPPED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusLabels = {
          ACTIVE: "ĐANG HỌC",
          GRADUATED: "TỐT NGHIỆP",
          DROPPED: "THÔI HỌC",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.status]}`}
          >
            {statusLabels[row.status]}
          </span>
        );
      },
    },
    {
      header: "Trạng thái điểm",
      accessorKey: "has_grades",
      render: (row: StudentItem) => {
        const hasGrades = row.has_grades;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${
              hasGrades
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {hasGrades ? (
              <>
                <CheckCircle2 size={10} className="text-emerald-400" />
                Có điểm
              </>
            ) : (
              <>
                <XCircle size={10} className="text-amber-400" />
                Chưa có điểm
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Thao tác quản lý",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenStudentDetail(row, "results")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-650 hover:text-white transition-all cursor-pointer"
            title="Quản lý điểm kết quả học tập"
          >
            <FileSpreadsheet size={13} />
            Xem điểm số
          </button>
          <button
            onClick={() => handleOpenStudentDetail(row, "uploads")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-605 hover:text-white transition-all cursor-pointer"
            title="Tải bảng điểm gốc"
          >
            <FileUp size={13} />
            Tải bảng điểm
          </button>
        </div>
      ),
    },
  ];

  // MAIN RENDER: Student List Screen
  if (!selectedStudentId) {
    const studentFiltersBlock = (
      <div className="flex flex-wrap items-center gap-3">
        {/* Grade status filter */}
        <select
          value={gradeStatusFilter}
          onChange={handleStudentGradeFilterChange}
          className="rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-800"
        >
          <option value="">-- Tất cả trạng thái điểm --</option>
          <option value="true">Đã có điểm (Có điểm)</option>
          <option value="false">Chưa có điểm</option>
        </select>

        {/* Study status filter */}
        <select
          value={studyStatusFilter}
          onChange={handleStudentStudyFilterChange}
          className="rounded-lg border border-slate-850 bg-slate-955 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-800"
        >
          <option value="">-- Tất cả trạng thái học --</option>
          <option value="ACTIVE">Đang học (ACTIVE)</option>
          <option value="GRADUATED">Tốt nghiệp (GRADUATED)</option>
          <option value="DROPPED">Thôi học (DROPPED)</option>
        </select>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetConfig}
              className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Quay lại chọn cấu hình"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Quản lý điểm số</h1>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                  {selectedMajor}
                </span>
                <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                  {currentClassName}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Hãy chọn một sinh viên bên dưới để xem điểm chi tiết hoặc tải tệp bảng điểm lên.
              </p>
            </div>
          </div>
        </div>

        {studentsHook.error && (
          <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
            {studentsHook.error}
          </div>
        )}

        {/* Data Table */}
        <DataTable<StudentItem>
          columns={studentTableColumns}
          data={studentsHook.data}
          loading={studentsHook.loading}
          total={studentsHook.total}
          page={studentsHook.page}
          limit={studentsHook.limit}
          onPageChange={studentsHook.setPage}
          onLimitChange={studentsHook.setLimit}
          searchValue={studentsHook.search}
          onSearchChange={studentsHook.setSearch}
          searchPlaceholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
          filters={studentFiltersBlock}
        />
      </div>
    );
  }

  // DETAIL SCREEN: Student Detail View
  const selectedStudentLabel = selectedStudent
    ? `${selectedStudent.student_code} - ${selectedStudent.full_name}`
    : selectedStudentId;

  return (
    <div className="space-y-6">
      {/* Student Meta Details Header Card */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-900/40 p-6 rounded-2xl border border-slate-800/80 shadow-md">
        <div className="flex items-start gap-4">
          <button
            onClick={handleBackToStudentList}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-955/80 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            title="Quay lại danh sách sinh viên"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-white m-0">
                {selectedStudent?.full_name || "N/A"}
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-350 border border-slate-700">
                {selectedStudent?.student_code || "N/A"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase ${
                selectedStudent?.has_grades
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {selectedStudent?.has_grades ? "Đã có điểm" : "Chưa có điểm"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <BookOpen size={13} className="text-slate-500" />
                Lớp: <strong className="text-slate-300">{currentClassName}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Layers size={13} className="text-slate-500" />
                Chuyên ngành: <strong className="text-slate-300">{selectedMajor}</strong>
              </span>
              {selectedStudent?.cohort_year && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-500" />
                  Khóa: <strong className="text-slate-300">{selectedStudent.cohort_year}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex bg-slate-955 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "results"
                ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/15"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet size={14} />
            Kết quả học tập
          </button>
          <button
            onClick={() => setActiveTab("uploads")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "uploads"
                ? "bg-teal-650 text-white shadow-md shadow-teal-605/15"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileUp size={14} />
            Lịch sử tải bảng điểm
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB WITH COMPOSITION */}
      {activeTab === "results" ? (
        <StudentResultsTab
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          programId={selectedStudentProgramId}
          onRefreshList={handleRefreshStudentData}
        />
      ) : (
        <TranscriptUploadsTab
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          onUploadSuccess={handleRefreshStudentData}
          onDeleteSuccess={handleRefreshStudentData}
        />
      )}
    </div>
  );
}
