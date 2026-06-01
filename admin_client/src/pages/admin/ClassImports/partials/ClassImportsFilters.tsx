import { X } from "lucide-react";

interface ClassDropdownItem {
  id: string;
  class_code: string;
  class_name?: string;
}

interface ClassImportsFiltersProps {
  filters: Record<string, unknown>;
  updateFilters: (filters: Record<string, unknown>) => void;
  clearFilters: () => void;
  classesList: ClassDropdownItem[];
}

export function ClassImportsFilters({
  filters,
  updateFilters,
  clearFilters,
  classesList,
}: ClassImportsFiltersProps) {
  const hasActiveFilters = !!(filters["class_id"] || filters["import_status"]);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Class Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.class_id as string) || ""}
          onChange={(e) => updateFilters({ class_id: e.target.value || undefined })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-45"
        >
          <option className="bg-slate-900 text-slate-400" value="">
            Tất cả lớp học
          </option>
          {classesList.map((c) => (
            <option className="bg-slate-900 text-slate-200" key={c.id} value={c.id}>
              {c.class_code}
            </option>
          ))}
        </select>
      </div>

      {/* Import Status Filter */}
      <div className="flex flex-col gap-1">
        <select
          value={(filters?.import_status as string) || ""}
          onChange={(e) => updateFilters({ import_status: e.target.value || undefined })}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer min-w-40"
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
