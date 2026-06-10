import React, { useState, useMemo } from "react";
import { Search, Trash2, Plus, Loader2, BookOpen, Edit2 } from "lucide-react";

export interface ResultItem {
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

interface StudentResultsTabProps {
  courseResults: ResultItem[];
  courseKbMap: Map<string, string>;
  kbLabelMap: Map<string, string>;
  loadingResultsTab: boolean;
  selectedResultIds: string[];
  setSelectedResultIds: (ids: string[]) => void;
  onEditResult: (row: ResultItem) => void;
  onDeleteResult: (id: string) => void;
  onBulkDelete: () => void;
  onCreateResult: () => void;
}

export default function StudentResultsTab({
  courseResults,
  courseKbMap,
  kbLabelMap,
  loadingResultsTab,
  selectedResultIds,
  setSelectedResultIds,
  onEditResult,
  onDeleteResult,
  onBulkDelete,
  onCreateResult
}: StudentResultsTabProps) {
  const [resultsSearch, setResultsSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

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

  return (
    <div className="space-y-4 relative z-10">
      {/* Results Filters & Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-455" />
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
              onClick={onBulkDelete}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-150 px-3.5 py-2 text-xs font-bold text-rose-650 shadow-sm transition hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 size={12} />
              Xóa đã chọn ({selectedResultIds.length})
            </button>
          )}

          <button
            onClick={onCreateResult}
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
                            onClick={() => onEditResult(row)}
                            className="p-2.5 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                            title="Sửa điểm số"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDeleteResult(row.id)}
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
  );
}
