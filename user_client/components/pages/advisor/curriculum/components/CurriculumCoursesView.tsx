import React, { useState, useEffect, useMemo } from "react";
import { Loader2, AlertCircle, List, Network, Search, Filter, Upload, ArrowLeft } from "lucide-react";
import { api } from "@/services/api";
import { InteractiveGraph } from "../../../student/InteractiveGraph";
import { CurriculumCourse, PrerequisiteRule } from "../../../student/simulator/components/types";
import { Program } from "./ProgramSelector";

interface RawCourseRow {
  course_code: string;
  course_name: string;
  credits?: string | number | null;
  expected_semester?: string | number | null;
  knowledge_block?: string | null;
  is_required?: boolean | null;
  course_type?: string | null;
}

interface RawPrereqRow {
  course_code: string;
  prerequisite_course_code: string;
  prerequisite_type?: string | null;
}

interface CurriculumCoursesViewProps {
  programId: string;
  selectedProgramDetails: Program | undefined;
  onBack: () => void;
  onImport: () => void;
}

export default function CurriculumCoursesView({
  programId,
  selectedProgramDetails,
  onBack,
  onImport
}: CurriculumCoursesViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");
  const [courses, setCourses] = useState<CurriculumCourse[]>([]);
  const [prereqs, setPrereqs] = useState<PrerequisiteRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlockFilter, setSelectedBlockFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!programId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coursesRes, prereqsRes] = await Promise.all([
          api.get(`/curriculum_courses?program_id=${programId}&limit=500`),
          api.get(`/course_prerequisites?program_id=${programId}&limit=500`)
        ]);

        const rawCourses = (coursesRes.data?.data ?? coursesRes.data ?? []) as RawCourseRow[];
        const rawPrereqs = (prereqsRes.data?.data ?? prereqsRes.data ?? []) as RawPrereqRow[];

        // Map database records to types
        const mappedCourses: CurriculumCourse[] = rawCourses.map((c) => ({
          course_code: c.course_code,
          course_name: c.course_name,
          credits: Number(c.credits) || 0,
          expected_semester: Number(c.expected_semester) || 1,
          knowledge_block: c.knowledge_block || "GENERAL",
          is_required: c.is_required !== false,
          course_type: c.course_type || "REQUIRED"
        }));

        const mappedPrereqs: PrerequisiteRule[] = rawPrereqs.map((p) => ({
          course_code: p.course_code,
          prerequisite_course_code: p.prerequisite_course_code,
          prerequisite_type: p.prerequisite_type || "REQUIRED"
        }));

        setCourses(mappedCourses);
        setPrereqs(mappedPrereqs);
      } catch (err) {
        console.error("Failed to load curriculum view data:", err);
        setError("Không thể tải cấu trúc môn học của chương trình đào tạo này.");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [programId]);

  // Filter logic
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        c.course_code.toLowerCase().includes(q) ||
        c.course_name.toLowerCase().includes(q);

      const matchesBlock = !selectedBlockFilter || c.knowledge_block === selectedBlockFilter;

      return matchesSearch && matchesBlock;
    });
  }, [courses, searchQuery, selectedBlockFilter]);

  // Pagination calculations
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;



  const getKnowledgeBlockBadge = (block?: string | null) => {
    const defaultStyle = "bg-neutral-50 text-neutral-600 border-neutral-100";
    if (!block) return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${defaultStyle}`}>Chưa phân loại</span>;
    
    switch (block) {
      case "GENERAL":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-100 bg-blue-50/50 text-blue-750">Đại cương</span>;
      case "SECTOR_CORE":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-orange-100 bg-orange-50/50 text-orange-755">Cơ sở khối ngành</span>;
      case "MAJOR_CORE":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-purple-100 bg-purple-50/50 text-purple-755">Cơ sở ngành</span>;
      case "SPECIALIZED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 bg-emerald-50/50 text-emerald-755">Chuyên ngành</span>;
      default:
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${defaultStyle}`}>{block}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center bg-white/50 backdrop-blur-xs border border-zinc-200 rounded-3xl shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang kết dựng sơ đồ môn học chương trình...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 bg-white border border-zinc-200 rounded-3xl shadow-md">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-lg font-bold text-neutral-900">Không tìm thấy dữ liệu</h1>
        <p className="text-xs text-neutral-550 max-w-xs mx-auto leading-relaxed">
          {error}
        </p>
        <button
          onClick={onBack}
          className="rounded-xl px-5 py-2.5 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-600 text-xs font-bold transition cursor-pointer"
        >
          Quay lại chọn CTĐT
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header action controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 border border-zinc-200 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-extrabold text-neutral-450 uppercase tracking-wider block font-mono">Đang quản lý chương trình</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100/70 border border-emerald-250 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              {selectedProgramDetails?.major_name || "Ngành học"}
            </span>
          </div>
          <h2 className="text-md font-extrabold text-neutral-900 tracking-tight leading-relaxed">
            {selectedProgramDetails?.program_name} ({selectedProgramDetails?.program_code})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Back to program selection */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 px-4 py-2.5 text-xs font-bold text-neutral-600 transition cursor-pointer active:scale-98"
          >
            <ArrowLeft size={13} />
            Đổi chương trình
          </button>

          {/* Import New Curriculum */}
          <button
            type="button"
            onClick={onImport}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-4.5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/15 transition cursor-pointer active:scale-98"
          >
            <Upload size={13} />
            Nhập khung chương trình
          </button>
        </div>
      </div>

      {/* Main View Mode Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2 bg-neutral-100 border border-zinc-200 rounded-xl p-1 font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-lg px-4.5 py-2 text-xs transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-emerald-850 shadow-sm border border-zinc-150"
                : "text-neutral-500 hover:text-neutral-750"
            }`}
          >
            <List size={13} />
            Dạng bảng
          </button>
          <button
            type="button"
            onClick={() => setViewMode("graph")}
            className={`flex items-center gap-1.5 rounded-lg px-4.5 py-2 text-xs transition-all cursor-pointer ${
              viewMode === "graph"
                ? "bg-white text-emerald-850 shadow-sm border border-zinc-150"
                : "text-neutral-500 hover:text-neutral-750"
            }`}
          >
            <Network size={13} />
            Sơ đồ trực quan
          </button>
        </div>
        
        <div className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider font-mono">
          Tổng số: {filteredCourses.length} môn học
        </div>
      </div>

      {/* Search and Filters - Only visible in table view */}
      {viewMode === "table" && (
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white/95 backdrop-blur-md p-4 border border-zinc-200 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã học phần, tên học phần..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-3 py-1.5 bg-neutral-50/50">
              <Filter size={14} className="text-neutral-500" />
              <select
                value={selectedBlockFilter}
                onChange={(e) => {
                  setSelectedBlockFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs text-neutral-700 bg-transparent outline-none cursor-pointer font-bold"
              >
                <option value="">Tất cả khối kiến thức</option>
                <option value="GENERAL">Đại cương</option>
                <option value="SECTOR_CORE">Cơ sở khối ngành</option>
                <option value="MAJOR_CORE">Cơ sở ngành</option>
                <option value="SPECIALIZED">Chuyên ngành</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View Contents */}
      {viewMode === "table" ? (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-neutral-500 font-bold text-[10px] uppercase tracking-wider select-none">
                    <th className="px-6 py-4">Mã môn</th>
                    <th className="px-6 py-4">Tên học phần</th>
                    <th className="px-6 py-4 text-center">Tín chỉ</th>
                    <th className="px-6 py-4">Khối kiến thức</th>
                    <th className="px-6 py-4">Loại môn</th>
                    <th className="px-6 py-4 text-center">Học kỳ dự kiến</th>
                    <th className="px-6 py-4">Môn tiên quyết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 font-semibold text-neutral-700">
                  {paginatedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20 text-neutral-450 italic">
                        Không tìm thấy học phần nào trong chương trình đào tạo.
                      </td>
                    </tr>
                  ) : (
                    paginatedCourses.map((c, idx) => (
                      <tr
                        key={`${c.course_code}-${idx}`}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-neutral-900">
                          {c.course_code}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-neutral-900">
                          {c.course_name}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-neutral-850 text-center">
                          {c.credits}
                        </td>
                        <td className="px-6 py-4">
                          {getKnowledgeBlockBadge(c.knowledge_block)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-lg bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-neutral-500 uppercase border border-zinc-200">
                            {c.course_type === "REQUIRED" ? "Bắt buộc" : c.course_type === "ELECTIVE" ? "Tự chọn" : c.course_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-neutral-800 text-center">
                          HK {c.expected_semester}
                        </td>
                        <td className="px-6 py-4 font-mono text-neutral-450 truncate max-w-44 text-[11px]">
                          {/* Get prerequisite codes */}
                          {prereqs.filter(r => r.course_code === c.course_code).map(r => r.prerequisite_course_code).join(", ") || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm text-xs font-bold text-neutral-500">
              <div>
                Hiển thị <span className="text-neutral-850">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-neutral-850">{Math.min(currentPage * itemsPerPage, filteredCourses.length)}</span> trong tổng số <span className="text-neutral-850">{filteredCourses.length}</span> môn học
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Trước
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`rounded-lg h-8 w-8 flex items-center justify-center transition cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/15"
                        : "border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl relative z-10">
          <InteractiveGraph
            curriculum={courses}
            prereqs={prereqs}
            results={[]}
          />
        </div>
      )}
    </div>
  );
}
