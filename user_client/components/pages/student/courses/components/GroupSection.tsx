import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CourseResult, CourseTable } from "./CourseTable";
import { GroupAnalytics } from "./GroupAnalytics";

export const KNOWLEDGE_BLOCK_COLORS: Record<
  string,
  { bg: string; text: string; border: string; badge: string }
> = {
  GENERAL: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-700 border-sky-200",
  },
  SECTOR_CORE: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
  },
  MAJOR_CORE: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  SPECIALIZED: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700 border-violet-200",
  },
  UNKNOWN: {
    bg: "bg-zinc-50",
    text: "text-zinc-600",
    border: "border-zinc-200",
    badge: "bg-zinc-100 text-zinc-600 border-zinc-200",
  },
};

interface GroupSectionProps {
  title: string;
  subtitle?: string;
  courses: CourseResult[];
  colorScheme?: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  defaultOpen?: boolean;
}

export function GroupSection({
  title,
  subtitle,
  courses,
  colorScheme,
  defaultOpen = true,
}: GroupSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const passed = courses.filter((c) => c.status === "PASSED").length;
  const credits = courses
    .filter((c) => c.status === "PASSED")
    .reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const scheme = colorScheme ?? KNOWLEDGE_BLOCK_COLORS["UNKNOWN"];

  return (
    <div
      className={`rounded-2xl border ${scheme.border} overflow-hidden shadow-sm`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-4 ${scheme.bg} hover:brightness-95 transition-all`}
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown size={16} className={scheme.text} />
          ) : (
            <ChevronRight size={16} className={scheme.text} />
          )}
          <div className="text-left">
            <p className={`text-sm font-extrabold ${scheme.text}`}>{title}</p>
            {subtitle && (
              <p className="text-[10px] text-neutral-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scheme.badge}`}
          >
            {courses.length} môn
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
            {passed} đạt
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-100">
            {credits} TC
          </span>
        </div>
      </button>

      {open && (
        <div className="bg-white">
          <GroupAnalytics courses={courses} />
          <CourseTable courses={courses} />
        </div>
      )}
    </div>
  );
}
