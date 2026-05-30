import { X } from "lucide-react";

interface ProgramDropdownItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string;
}

interface CurriculumImportsFiltersProps {
  filters: Record<string, unknown>;
  updateFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
  programsList: ProgramDropdownItem[];
}

export function CurriculumImportsFilters({
  filters,
  updateFilters,
  clearFilters,
  programsList,
}: CurriculumImportsFiltersProps) {
  const hasActiveFilters =
    !!(filters["import_status"] || filters["program_id"] || filters["major_name"]);

  // Extract unique, non-empty majors from programs list
  const uniqueMajors = Array.from(
    new Set(
      programsList
        .map((p) => p.major_name)
        .filter((name): name is string => typeof name === "string" && name.trim().length > 0)
    )
  ).sort();

  // Filter programs list to only show ones belonging to the selected major
  const filteredProgramsList = filters?.major_name
    ? programsList.filter((p) => p.major_name === filters.major_name)
    : programsList;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Major Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.major_name as string) || ""}
          onChange={(e) =>
            updateFilters({
              major_name: e.target.value || undefined,
              program_id: undefined, // Reset program filter if major changes
            })
          }
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-45"
        >
          <option className="bg-slate-900 text-slate-400" value="">
            Tất cả ngành học
          </option>
          {uniqueMajors.map((major) => (
            <option className="bg-slate-900 text-slate-200" key={major} value={major}>
              {major}
            </option>
          ))}
        </select>
      </div>

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
          {filteredProgramsList.map((p) => (
            <option className="bg-slate-900 text-slate-200" key={p.id} value={p.id}>
              {p.program_code} - {p.program_name}
            </option>
          ))}
        </select>
      </div>

      {/* Import Status Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.import_status as string) || ""}
          onChange={(e) => updateFilters({ import_status: e.target.value || undefined })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-42.5"
        >
          <option className="bg-slate-900 text-slate-400" value="">
            Tất cả trạng thái
          </option>
          <option className="bg-slate-900 text-amber-400" value="PENDING">
            Chờ xử lý (PENDING)
          </option>
          <option className="bg-slate-900 text-emerald-400" value="SUCCESS">
            Thành công (SUCCESS)
          </option>
          <option className="bg-slate-900 text-rose-400" value="FAILED">
            Thất bại (FAILED)
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
