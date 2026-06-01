import { X } from "lucide-react";

interface ProgramDropdownItem {
  id: string;
  program_code: string;
  program_name: string;
}

interface CoursePrerequisitesFiltersProps {
  filters: Record<string, unknown>;
  updateFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
  programsList: ProgramDropdownItem[];
}

export function CoursePrerequisitesFilters({
  filters,
  updateFilters,
  clearFilters,
  programsList,
}: CoursePrerequisitesFiltersProps) {
  const hasActiveFilters = !!(filters["program_id"] || filters["prerequisite_type"]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Program Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.program_id as string) || ""}
          onChange={(e) => updateFilters({ program_id: e.target.value || undefined })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-50"
        >
          <option className="bg-slate-900 text-slate-400" value="">
            Tất cả chương trình học
          </option>
          {programsList.map((p) => (
            <option className="bg-slate-900 text-slate-200" key={p.id} value={p.id}>
              {p.program_code} - {p.program_name}
            </option>
          ))}
        </select>
      </div>

      {/* Prerequisite Type Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.prerequisite_type as string) || ""}
          onChange={(e) => updateFilters({ prerequisite_type: e.target.value || undefined })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-45"
        >
          <option className="bg-slate-900 text-slate-400" value="">
            Tất cả loại điều kiện
          </option>
          <option className="bg-slate-900 text-rose-400" value="REQUIRED">
            Bắt buộc (REQUIRED)
          </option>
          <option className="bg-slate-900 text-amber-400" value="RECOMMENDED">
            Khuyến nghị (RECOMMENDED)
          </option>
          <option className="bg-slate-900 text-sky-400" value="PREVIOUS">
            Môn học trước (PREVIOUS)
          </option>
          <option className="bg-slate-900 text-slate-400" value="OTHER">
            Khác (OTHER)
          </option>
        </select>
      </div>

      {/* Reset Filters button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
        >
          <X size={14} />
          Xóa lọc
        </button>
      )}
    </div>
  );
}
