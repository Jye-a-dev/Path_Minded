import { RefreshCw } from "lucide-react";

interface DropdownItem {
  id: string;
  label: string;
}

interface CurriculumCoursesFiltersProps {
  filters: Record<string, unknown> | null;
  updateFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
  selectedProgramId: string;
  programsList: DropdownItem[];
  knowledgeBlocks: DropdownItem[];
}

export function CurriculumCoursesFilters({
  filters,
  updateFilters,
  clearFilters,
  selectedProgramId,
  programsList,
  knowledgeBlocks,
}: CurriculumCoursesFiltersProps) {
  const hasActiveFilters =
    filters &&
    !!(
      filters["program_id"] ||
      filters["course_type"] ||
      filters["expected_semester"] ||
      filters["knowledge_block"]
    );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Program Filter */}
      <select
        value={(filters?.program_id as string) || ""}
        onChange={(e) => updateFilters({ program_id: e.target.value || undefined })}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
      >
        <option className="bg-slate-900 text-slate-200" value="">
          -- Chương trình --
        </option>
        {programsList.map((p) => (
          <option className="bg-slate-900 text-slate-200" key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Course Type Filter */}
      <select
        value={(filters?.course_type as string) || ""}
        onChange={(e) => updateFilters({ course_type: e.target.value || undefined })}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
      >
        <option className="bg-slate-900 text-slate-200" value="">
          -- Loại môn --
        </option>
        <option className="bg-slate-900 text-slate-200" value="REQUIRED">
          Bắt buộc
        </option>
        <option className="bg-slate-900 text-slate-200" value="ELECTIVE">
          Tự chọn
        </option>
        <option className="bg-slate-900 text-slate-200" value="PE">
          Thể chất
        </option>
        <option className="bg-slate-900 text-slate-200" value="ENGLISH">
          Tiếng Anh
        </option>
        <option className="bg-slate-900 text-slate-200" value="DEFENSE">
          Quốc phòng
        </option>
        <option className="bg-slate-900 text-slate-200" value="OTHER">
          Khác
        </option>
      </select>

      {/* Semester Filter */}
      <select
        value={(filters?.expected_semester as string) || ""}
        onChange={(e) =>
          updateFilters({
            expected_semester: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
      >
        <option className="bg-slate-900 text-slate-200" value="">
          -- Học kỳ --
        </option>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
          <option className="bg-slate-900 text-slate-200" key={sem} value={sem}>
            Học kỳ {sem}
          </option>
        ))}
      </select>

      {/* Knowledge Block Filter */}
      <select
        value={(filters?.knowledge_block as string) || ""}
        onChange={(e) => updateFilters({ knowledge_block: e.target.value || undefined })}
        className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer"
      >
        <option className="bg-slate-900 text-slate-200" value="">
          -- Khối kiến thức --
        </option>
        {knowledgeBlocks.map((kb) => (
          <option className="bg-slate-900 text-slate-200" key={kb.id} value={kb.id}>
            {kb.label}
          </option>
        ))}
      </select>

      {/* Reset Filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            clearFilters();
            // Reapply active program filter
            updateFilters({ program_id: selectedProgramId });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-955/60 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <RefreshCw size={12} />
          Xóa lọc
        </button>
      )}
    </div>
  );
}
