import React from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ,
  CalendarDays,
  Layers,
} from "lucide-react";

interface CoursesToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  sortOrder: "default" | "az" | "za";
  setSortOrder: (s: "default" | "az" | "za") => void;
  groupMode: "semester" | "knowledge";
  setGroupMode: (s: "semester" | "knowledge") => void;
}

export function CoursesToolbar({
  search,
  setSearch,
  sortOrder,
  setSortOrder,
  groupMode,
  setGroupMode,
}: CoursesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
      {/* Search */}
      <div className="relative max-w-xs w-full">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          placeholder="Tìm theo mã môn hoặc tên môn..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
        {/* Sort dropdown */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
          <button
            onClick={() => setSortOrder("default")}
            title="Thứ tự mặc định"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortOrder === "default"
                ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <ArrowUpDown size={13} />
            Mặc định
          </button>
          <button
            onClick={() => setSortOrder("az")}
            title="Sắp xếp A → Z"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortOrder === "az"
                ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <ArrowUpAZ size={13} />
            A → Z
          </button>
          <button
            onClick={() => setSortOrder("za")}
            title="Sắp xếp Z → A"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sortOrder === "za"
                ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <ArrowDownAZ size={13} />
            Z → A
          </button>
        </div>

        {/* Group mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
          <button
            onClick={() => setGroupMode("semester")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              groupMode === "semester"
                ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <CalendarDays size={13} />
            Theo học kỳ
          </button>
          <button
            onClick={() => setGroupMode("knowledge")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              groupMode === "knowledge"
                ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <Layers size={13} />
            Theo khối kiến thức
          </button>
        </div>
      </div>
    </div>
  );
}
