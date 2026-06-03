import React, { useState, useEffect } from "react";
import { useStudentCourseResults } from "../../../hooks/useStudentCourseResults";
import type { StudentCourseResultItem as ResultItem } from "../../../hooks/useStudentCourseResults";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2, ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { StudentCourseResultForm } from "./StudentCourseResultForm";
import { api } from "../../../services/api";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import type { KnowledgeBlockMappingItem } from "../../../hooks/useKnowledgeBlockMappings";
import type { CourseItem } from "../../../hooks/useCurriculumCourses";

interface ProgramItem {
  id: string;
  program_name: string;
  major_name?: string;
}

interface ClassItem {
  id: string;
  class_code: string;
}

interface DropdownItem {
  id: string;
  label: string;
  program_id?: string;
}

export default function StudentCourseResults() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    setPage,
    setLimit,
    setSearch,
    createItem,
    updateItem,
    deleteItem,
    updateFilters,
    bulkDelete,
  } = useStudentCourseResults();

  // Setup screen states
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudentProgramId, setSelectedStudentProgramId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [uniqueSchoolYears, setUniqueSchoolYears] = useState<string[]>([]);
  const [uniqueSemesters, setUniqueSemesters] = useState<string[]>([]);

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [studentsList, setStudentsList] = useState<DropdownItem[]>([]);

  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResultItem | null>(null);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Bulk delete confirmation states
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Delete all states
  const [allStudentResultIds, setAllStudentResultIds] = useState<string[]>([]);
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [deleteAllPrompt, setDeleteAllPrompt] = useState("");

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

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get(`/students?limit=250&class_id=${selectedClassId}`);
        setStudentsList(
          (response.data || []).map((s: { id: string; student_code: string; full_name: string; program_id?: string }) => ({
            id: s.id,
            label: `${s.student_code} - ${s.full_name}`,
            program_id: s.program_id,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch students list:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    void fetchStudents();
  }, [selectedClassId]);

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMajor(val);
    setSelectedClassId("");
    setClassesList([]);
    setSelectedStudentId("");
    setStudentsList([]);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClassId(val);
    setSelectedStudentId("");
    setStudentsList([]);
  };

  // Knowledge blocks and curriculum courses states
  const [kbMappings, setKbMappings] = useState<KnowledgeBlockMappingItem[]>([]);
  const [programCourses, setProgramCourses] = useState<CourseItem[]>([]);
  const [loadingKbData, setLoadingKbData] = useState(false);

  useEffect(() => {
    if (!isConfigured || !selectedStudentProgramId) {
      return;
    }

    const fetchKbData = async () => {
      setLoadingKbData(true);
      try {
        const [mappingsRes, coursesRes] = await Promise.all([
          api.get<KnowledgeBlockMappingItem[]>("/knowledge_block_mappings"),
          api.get<CourseItem[]>(`/curriculum_courses?limit=1000&program_id=${selectedStudentProgramId}`),
        ]);
        setKbMappings(mappingsRes.data || []);
        setProgramCourses(coursesRes.data || []);
      } catch (err) {
        console.error("Failed to fetch knowledge block data or curriculum courses:", err);
      } finally {
        setLoadingKbData(false);
      }
    };

    void fetchKbData();
  }, [isConfigured, selectedStudentProgramId]);

  // Load unique school years, semesters, and result IDs for the configured student
  useEffect(() => {
    if (!isConfigured || !selectedStudentId) {
      return;
    }

    const fetchAllStudentResults = async () => {
      try {
        const response = await api.get<ResultItem[]>(`/student_course_results?limit=1000&student_id=${selectedStudentId}`);
        const ids = (response.data || []).map((r) => r.id);
        setAllStudentResultIds(ids);

        const years = Array.from(
          new Set(response.data.map((r) => r.school_year).filter((y): y is string => !!y))
        ).sort();
        const sems = Array.from(
          new Set(response.data.map((r) => r.semester_code).filter((s): s is string => !!s))
        ).sort();
        setUniqueSchoolYears(years);
        setUniqueSemesters(sems);
      } catch (err) {
        console.error("Failed to fetch all student results for filters:", err);
      }
    };

    void fetchAllStudentResults();
  }, [isConfigured, selectedStudentId]);

  const handleConfirmConfig = () => {
    if (selectedStudentId) {
      const stud = studentsList.find((s) => s.id === selectedStudentId);
      setSelectedStudentProgramId(stud?.program_id || "");
      updateFilters({ student_id: selectedStudentId, status: undefined });
      setSelectedStatus("");
      setIsConfigured(true);
    }
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
    setSelectedStudentProgramId("");
    updateFilters({ student_id: undefined, status: undefined, school_year: undefined, semester_code: undefined });
    setSelectedStatus("");
    setSelectedSchoolYear("");
    setSelectedSemester("");
    setProgramCourses([]);
    setKbMappings([]);
    setUniqueSchoolYears([]);
    setUniqueSemesters([]);
    setSelectedIds([]);
    setAllStudentResultIds([]);
  };

  const handleBulkDelete = () => {
    setBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    try {
      await bulkDelete(selectedIds);
      setSelectedIds([]);
      // Refresh the all student results IDs
      setAllStudentResultIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa các kết quả học tập thất bại");
    }
  };

  const handleDeleteAll = () => {
    setDeleteAllConfirmOpen(true);
  };

  const handleConfirmDeleteAll = async () => {
    try {
      await bulkDelete(allStudentResultIds);
      setAllStudentResultIds([]);
      setSelectedIds([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa tất cả kết quả học tập thất bại");
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStatus(val);
    updateFilters({ status: val || undefined });
  };

  const handleSchoolYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSchoolYear(val);
    updateFilters({ school_year: val || undefined });
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSemester(val);
    updateFilters({ semester_code: val || undefined });
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ResultItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    student_id: string;
    course_code: string;
    course_name: string | null;
    credits: number | null;
    school_year: string | null;
    semester_code: string | null;
    semester_number: number | null;
    score_10: number | null;
    score_4: number | null;
    letter_grade: string | null;
    status: "PASSED" | "FAILED" | "STUDYING";
    attempt_no: number | null;
    is_latest: boolean;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteItem(deletingId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa kết quả học tập sinh viên thất bại");
      }
    }
  };

  // Create a map of course_code -> knowledge_block
  const courseKbMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of programCourses) {
      if (c.course_code && c.knowledge_block) {
        map.set(c.course_code.toUpperCase().trim(), c.knowledge_block);
      }
    }
    return map;
  }, [programCourses]);

  // Create a map of knowledge_block -> label
  const kbLabelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const m of kbMappings) {
      map.set(m.knowledge_block, m.label);
    }
    // Add default names if not present
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

  const sortedData = React.useMemo(() => {
    if (!isConfigured) return data;

    const ORDER = ["GENERAL", "SECTOR_CORE", "MAJOR_CORE", "SPECIALIZED"];

    return [...data].sort((a, b) => {
      const codeA = (a.course_code || "").toUpperCase().trim();
      const codeB = (b.course_code || "").toUpperCase().trim();

      const kbA = courseKbMap.get(codeA) || "OTHER";
      const kbB = courseKbMap.get(codeB) || "OTHER";

      const idxA = ORDER.indexOf(kbA);
      const idxB = ORDER.indexOf(kbB);

      // Sort by knowledge block order first
      if (idxA !== -1 && idxB !== -1) {
        if (idxA !== idxB) return idxA - idxB;
      } else if (idxA !== -1) {
        return -1;
      } else if (idxB !== -1) {
        return 1;
      } else {
        // Both are in "OTHER" or not in ORDER
        if (kbA !== kbB) return kbA.localeCompare(kbB);
      }

      // If knowledge blocks are the same, sort by course_code
      return codeA.localeCompare(codeB);
    });
  }, [data, isConfigured, courseKbMap]);

  const columns = [
    {
      header: "Môn học",
      accessorKey: "course_code",
      render: (row: ResultItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-200 block">{row.course_code}</span>
          <span className="text-[10px] text-slate-500 max-w-50 truncate block">{row.course_name || "Không có tên môn"}</span>
        </div>
      ),
    },
    {
      header: "Tín chỉ",
      accessorKey: "credits",
      render: (row: ResultItem) => (
        <span className="text-slate-400 font-semibold">{row.credits ?? "N/A"}</span>
      ),
    },
    {
      header: "Khối kiến thức",
      render: (row: ResultItem) => {
        const code = (row.course_code || "").toUpperCase().trim();
        const kb = courseKbMap.get(code);
        const label = kb ? (kbLabelMap.get(kb) || kb) : "Chưa phân loại";

        const kbColors: Record<string, string> = {
          GENERAL: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          SECTOR_CORE: "bg-teal-500/10 text-teal-400 border-teal-500/20",
          MAJOR_CORE: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          SPECIALIZED: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        };

        const colorClass = kb ? (kbColors[kb] || "bg-slate-800 text-slate-400 border-slate-700") : "bg-slate-900/50 text-slate-500 border-slate-800/80";

        return (
          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold border uppercase tracking-wider ${colorClass}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      header: "Học kỳ / Năm học",
      render: (row: ResultItem) => (
        <span className="text-slate-400 text-xs font-medium">
          {row.semester_code || "N/A"} ({row.school_year || "N/A"})
        </span>
      ),
    },
    {
      header: "Điểm số",
      render: (row: ResultItem) => (
        <div className="text-xs">
          <span className="text-slate-200 font-bold font-mono">
            {row.letter_grade || "N/A"}{" "}
          </span>
          <span className="text-slate-500 font-semibold font-mono">
            ({row.score_10 ?? "N/A"} / {row.score_4 ?? "N/A"})
          </span>
        </div>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      render: (row: ResultItem) => {
        const colors = {
          PASSED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          STUDYING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
        const statusMap = {
          PASSED: "ĐẠT",
          FAILED: "TRƯỢT",
          STUDYING: "ĐANG HỌC",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${colors[row.status]}`}
          >
            {statusMap[row.status]}
          </span>
        );
      },
    },
    {
      header: "Thao tác",
      render: (row: ResultItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <GraduationCap className="text-indigo-400! h-8 w-8" />
            Kết quả học tập
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành, lớp học và sinh viên mục tiêu.
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
                  onChange={handleMajorChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
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
                    onChange={handleClassChange}
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

              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sinh viên</label>
                {loadingStudents ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-955/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách sinh viên...
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    disabled={!selectedClassId || studentsList.length === 0}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-550" value="">
                      {!selectedClassId
                        ? "-- Vui lòng chọn lớp học trước --"
                        : studentsList.length === 0
                        ? "-- Không tìm thấy sinh viên nào --"
                        : "-- Chọn sinh viên --"}
                    </option>
                    {studentsList.map((s) => (
                      <option className="bg-slate-900 text-slate-100" key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmConfig}
              disabled={!selectedStudentId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận cấu hình
            </button>
          </div>
        )}
      </div>
    );
  }

  const selectedClassName = classesList.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;
  const selectedStudentLabel = studentsList.find((s) => s.id === selectedStudentId)?.label ?? selectedStudentId;

  const filtersBlock = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <select
        value={selectedStatus}
        onChange={handleStatusChange}
        className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-800"
      >
        <option value="">-- Tất cả trạng thái --</option>
        <option value="PASSED">ĐẠT (PASSED)</option>
        <option value="FAILED">TRƯỢT (FAILED)</option>
        <option value="STUDYING">ĐANG HỌC (STUDYING)</option>
      </select>

      {/* School Year Filter */}
      <select
        value={selectedSchoolYear}
        onChange={handleSchoolYearChange}
        className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-800"
      >
        <option value="">-- Tất cả năm học --</option>
        {uniqueSchoolYears.map((year) => (
          <option key={year} value={year}>Năm học {year}</option>
        ))}
      </select>

      {/* Semester Filter */}
      <select
        value={selectedSemester}
        onChange={handleSemesterChange}
        className="rounded-lg border border-slate-855 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-800"
      >
        <option value="">-- Tất cả học kỳ --</option>
        {uniqueSemesters.map((sem) => (
          <option key={sem} value={sem}>Học kỳ {sem}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Kết quả học tập</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                Lớp {selectedClassName}
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                {selectedStudentLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Đang xem kết quả học tập của sinh viên{" "}
              <span className="text-slate-200 font-semibold">{selectedStudentLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ResultItem>
        columns={columns}
        data={sortedData}
        loading={loading || loadingKbData}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm kiếm mã hoặc tên môn học..."
        filters={filtersBlock}
        enableSelection={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 px-3.5 py-2 text-sm font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 hover:text-white transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Xóa đã chọn ({selectedIds.length})
              </button>
            )}
            {allStudentResultIds.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600/10 px-3.5 py-2 text-sm font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-600/20 hover:text-amber-300 transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Xóa tất cả kết quả
              </button>
            )}
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo kết quả
            </button>
          </div>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa điểm số sinh viên" : "Thêm điểm số sinh viên mới"}
        size="lg"
      >
        <StudentCourseResultForm
          key={editingItem ? editingItem.id : (selectedStudentId || "create")}
          editingItem={editingItem}
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingId(null);
        }}
        title="Xóa kết quả học tập"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn kết quả học tập này của sinh viên không? Hành động này không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmDelete}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        title="Xóa nhiều kết quả học tập"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedIds.length} kết quả học tập đã chọn không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmBulkDelete}
      />

      {/* Delete All Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteAllConfirmOpen}
        onClose={() => {
          setDeleteAllConfirmOpen(false);
          setDeleteAllPrompt("");
        }}
        title="XÓA TOÀN BỘ KẾT QUẢ HỌC TẬP"
        message={`Bạn có chắc chắn muốn xóa TOÀN BỘ ${allStudentResultIds.length} kết quả học tập của sinh viên này không?\nHành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.`}
        confirmText="Xóa toàn bộ"
        cancelText="Hủy"
        isDanger={true}
        requirePromptText="DELETE"
        promptValue={deleteAllPrompt}
        onPromptValueChange={setDeleteAllPrompt}
        onConfirm={handleConfirmDeleteAll}
      />
    </div>
  );
}
