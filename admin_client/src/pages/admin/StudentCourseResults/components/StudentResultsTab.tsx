import { useState, useEffect, useMemo } from "react";
import { useStudentCourseResults } from "../../../../hooks/useStudentCourseResults";
import type { StudentCourseResultItem as ResultItem } from "../../../../hooks/useStudentCourseResults";
import { DataTable } from "../../../../components/data_display/DataTable";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmModal } from "../../../../components/ui/ConfirmModal";
import { StudentCourseResultForm } from "../StudentCourseResultForm";
import { api } from "../../../../services/api";
import type { KnowledgeBlockMappingItem } from "../../../../hooks/useKnowledgeBlockMappings";
import type { CourseItem } from "../../../../hooks/useCurriculumCourses";
import {
  Plus,
  Edit2,
  Trash2
} from "lucide-react";

interface StudentResultsTabProps {
  studentId: string;
  studentLabel: string;
  programId: string;
  onRefreshList?: () => void;
}

export function StudentResultsTab({
  studentId,
  studentLabel,
  programId,
  onRefreshList
}: StudentResultsTabProps) {
  const courseResultsHook = useStudentCourseResults(studentId);

  // Filter and Modal States
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [uniqueSchoolYears, setUniqueSchoolYears] = useState<string[]>([]);
  const [uniqueSemesters, setUniqueSemesters] = useState<string[]>([]);
  const [kbMappings, setKbMappings] = useState<KnowledgeBlockMappingItem[]>([]);
  const [programCourses, setProgramCourses] = useState<CourseItem[]>([]);
  const [loadingKbData, setLoadingKbData] = useState(false);
  
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [selectedResultIds, setSelectedResultIds] = useState<(string | number)[]>([]);
  const [resultDeleteConfirmOpen, setResultDeleteConfirmOpen] = useState(false);
  const [deletingResultId, setDeletingResultId] = useState<string | null>(null);
  const [bulkResultDeleteConfirmOpen, setBulkResultDeleteConfirmOpen] = useState(false);
  const [deleteAllResultsConfirmOpen, setDeleteAllResultsConfirmOpen] = useState(false);
  const [allStudentResultIds, setAllStudentResultIds] = useState<string[]>([]);
  
  // Trigger to fetch year/semester lists on data changes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load KB and Courses on mount or programId change
  useEffect(() => {
    if (!studentId || !programId) return;

    const fetchKbData = async () => {
      setLoadingKbData(true);
      try {
        const [mappingsRes, coursesRes] = await Promise.all([
          api.get("/knowledge_block_mappings"),
          api.get(`/curriculum_courses?limit=1000&program_id=${programId}`),
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
  }, [studentId, programId]);

  // Load unique school years, semesters, and result IDs for dropdown filters
  useEffect(() => {
    if (!studentId) return;

    const fetchAllStudentResults = async () => {
      try {
        const response = await api.get<ResultItem[]>(`/student_course_results?limit=1000&student_id=${studentId}`);
        const ids = (response.data || []).map((r) => r.id);
        setAllStudentResultIds(ids);

        const years = Array.from(
          new Set(response.data.map((r) => r.school_year).filter((y): y is string => !!y))
        ).sort() as string[];
        const sems = Array.from(
          new Set(response.data.map((r) => r.semester_code).filter((s): s is string => !!s))
        ).sort() as string[];
        setUniqueSchoolYears(years);
        setUniqueSemesters(sems);
      } catch (err) {
        console.error("Failed to fetch all student results for filters:", err);
      }
    };

    void fetchAllStudentResults();
  }, [studentId, refreshTrigger]);



  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
    if (onRefreshList) {
      onRefreshList();
    }
  };

  const handleOpenCreateResult = () => {
    setEditingResult(null);
    setResultsModalOpen(true);
  };

  const handleOpenEditResult = (item: ResultItem) => {
    setEditingResult(item);
    setResultsModalOpen(true);
  };

  const handleResultSubmit = async (payload: Parameters<typeof courseResultsHook.createItem>[0]) => {
    try {
      if (editingResult) {
        await courseResultsHook.updateItem(editingResult.id, payload);
      } else {
        await courseResultsHook.createItem(payload);
      }
      setResultsModalOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  const handleResultDelete = (id: string) => {
    setDeletingResultId(id);
    setResultDeleteConfirmOpen(true);
  };

  const handleConfirmResultDelete = async () => {
    if (deletingResultId) {
      try {
        await courseResultsHook.deleteItem(deletingResultId);
        setResultDeleteConfirmOpen(false);
        setDeletingResultId(null);
        triggerRefresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa điểm thất bại");
      }
    }
  };

  const handleConfirmBulkResultDelete = async () => {
    try {
      await courseResultsHook.bulkDelete(selectedResultIds);
      setSelectedResultIds([]);
      setBulkResultDeleteConfirmOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa các điểm thất bại");
    }
  };

  const handleConfirmDeleteAllResults = async () => {
    try {
      await courseResultsHook.bulkDelete(allStudentResultIds);
      setAllStudentResultIds([]);
      setSelectedResultIds([]);
      setDeleteAllResultsConfirmOpen(false);
      triggerRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa tất cả kết quả học tập thất bại");
    }
  };

  // Memoized maps for Knowledge Blocks in Course Results
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
    return [...courseResultsHook.data].sort((a, b) => {
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
  }, [courseResultsHook.data, courseKbMap]);

  // Course Results Columns
  const resultColumns = [
    {
      header: "Môn học",
      accessorKey: "course_code",
      render: (row: ResultItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-200 block">{row.course_code}</span>
          <span className="text-[10px] text-slate-500 max-w-50 truncate block" title={row.course_name || ""}>
            {row.course_name || "Không có tên môn"}
          </span>
        </div>
      ),
    },
    {
      header: "Tín chỉ",
      accessorKey: "credits",
      render: (row: ResultItem) => (
        <span className="text-slate-450 font-semibold">{row.credits ?? "N/A"}</span>
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
            className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${colorClass}`}
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
            onClick={() => handleOpenEditResult(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleResultDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const resultsFiltersBlock = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <select
        value={selectedStatus}
        onChange={(e) => {
          setSelectedStatus(e.target.value);
          courseResultsHook.updateFilters({ status: e.target.value || undefined });
        }}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
      >
        <option className="bg-slate-900 text-slate-400" value="">-- Tất cả trạng thái --</option>
        <option className="bg-slate-900 text-white font-medium" value="PASSED">ĐẠT (PASSED)</option>
        <option className="bg-slate-900 text-white font-medium" value="FAILED">TRƯỢT (FAILED)</option>
        <option className="bg-slate-900 text-white font-medium" value="STUDYING">ĐANG HỌC (STUDYING)</option>
      </select>

      {/* School Year Filter */}
      <select
        value={selectedSchoolYear}
        onChange={(e) => {
          setSelectedSchoolYear(e.target.value);
          courseResultsHook.updateFilters({ school_year: e.target.value || undefined });
        }}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
      >
        <option className="bg-slate-900 text-slate-400" value="">-- Tất cả năm học --</option>
        {uniqueSchoolYears.map((year) => (
          <option className="bg-slate-900 text-white font-medium" key={year} value={year}>Năm học {year}</option>
        ))}
      </select>

      {/* Semester Filter */}
      <select
        value={selectedSemester}
        onChange={(e) => {
          setSelectedSemester(e.target.value);
          courseResultsHook.updateFilters({ semester_code: e.target.value || undefined });
        }}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
      >
        <option className="bg-slate-900 text-slate-400" value="">-- Tất cả học kỳ --</option>
        {uniqueSemesters.map((sem) => (
          <option className="bg-slate-900 text-white font-medium" key={sem} value={sem}>Học kỳ {sem}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {courseResultsHook.error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {courseResultsHook.error}
        </div>
      )}

      <DataTable<ResultItem>
        columns={resultColumns}
        data={sortedCourseData}
        loading={courseResultsHook.loading || loadingKbData}
        total={courseResultsHook.total}
        page={courseResultsHook.page}
        limit={courseResultsHook.limit}
        onPageChange={courseResultsHook.setPage}
        onLimitChange={courseResultsHook.setLimit}
        searchValue={courseResultsHook.search}
        onSearchChange={courseResultsHook.setSearch}
        searchPlaceholder="Tìm kiếm mã hoặc tên môn học..."
        filters={resultsFiltersBlock}
        enableSelection={true}
        selectedIds={selectedResultIds}
        onSelectionChange={setSelectedResultIds}
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            {selectedResultIds.length > 0 && (
              <button
                onClick={() => setBulkResultDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600/20 px-3.5 py-2 text-sm font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 hover:text-white transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Xóa đã chọn ({selectedResultIds.length})
              </button>
            )}
            {allStudentResultIds.length > 0 && (
              <button
                onClick={() => setDeleteAllResultsConfirmOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600/10 px-3.5 py-2 text-sm font-semibold text-amber-400 border border-amber-500/20 hover:bg-amber-600/20 hover:text-amber-300 transition-all cursor-pointer"
              >
                <Trash2 size={16} />
                Xóa tất cả điểm
              </button>
            )}
            <button
              onClick={handleOpenCreateResult}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus size={16} />
              Tạo kết quả
            </button>
          </div>
        }
      />

      {/* MODALS */}
      <Modal
        isOpen={resultsModalOpen}
        onClose={() => setResultsModalOpen(false)}
        title={editingResult ? "Chỉnh sửa điểm số sinh viên" : "Thêm điểm số sinh viên mới"}
        size="lg"
      >
        <StudentCourseResultForm
          key={editingResult ? editingResult.id : (studentId || "create")}
          editingItem={editingResult}
          studentId={studentId}
          studentLabel={studentLabel}
          onSubmit={handleResultSubmit}
          onCancel={() => setResultsModalOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={resultDeleteConfirmOpen}
        onClose={() => {
          setResultDeleteConfirmOpen(false);
          setDeletingResultId(null);
        }}
        title="Xóa kết quả học tập"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn kết quả học tập này của sinh viên không? Hành động này không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmResultDelete}
      />

      <ConfirmModal
        isOpen={bulkResultDeleteConfirmOpen}
        onClose={() => setBulkResultDeleteConfirmOpen(false)}
        title="Xóa nhiều kết quả học tập"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedResultIds.length} kết quả học tập đã chọn không?`}
        confirmText="Xóa đã chọn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmBulkResultDelete}
      />

      <ConfirmModal
        isOpen={deleteAllResultsConfirmOpen}
        onClose={() => setDeleteAllResultsConfirmOpen(false)}
        title="Xóa tất cả điểm số"
        message="CẢNH BÁO: Hành động này sẽ xóa toàn bộ điểm số của sinh viên này vĩnh viễn khỏi hệ thống. Bạn có thực sự muốn tiếp tục không?"
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmDeleteAllResults}
      />
    </div>
  );
}
