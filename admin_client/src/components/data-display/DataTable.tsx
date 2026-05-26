import React from "react";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";

interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  rightActions?: React.ReactNode;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  loading,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  rightActions,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {onSearchChange !== undefined && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
              />
            </div>
          )}
          {filters}
        </div>
        {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/10">
              {loading ? (
                // Skeleton Loader
                Array.from({ length: limit }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="px-6 py-4">
                        <div className="h-4 rounded bg-slate-800 w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="rounded-full bg-slate-900/80 p-3 text-slate-500 border border-slate-800">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-600 hidden" />
                        <Search className="h-6 w-6 text-slate-600" />
                      </div>
                      <p className="text-base font-semibold text-slate-300">Không tìm thấy bản ghi nào</p>
                      <p className="text-xs text-slate-500">
                        Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Rows Data
                data.map((row, rIdx) => (
                  <tr
                    key={row.id ?? rIdx}
                    className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                        {col.render
                          ? col.render(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey as keyof T] ?? "")
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 bg-slate-900/30 px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Hiển thị</span>
            <select
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
            <span>trong tổng số {total} bản ghi</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-300 px-3">
              Trang {page} trên {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
