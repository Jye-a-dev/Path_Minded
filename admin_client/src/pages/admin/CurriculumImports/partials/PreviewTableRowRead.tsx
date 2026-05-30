import React from "react";
import { Edit2, Trash2 } from "lucide-react";

interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
}

interface PreviewTableRowReadProps {
  idx: number;
  c: CoursePreviewItem;
  compositeKey: string;
  isSelected: boolean;
  onStartEdit: (index: number, course: CoursePreviewItem) => void;
  onDeleteRow: (index: number, compositeKey: string) => void;
  knowledgeBlocks: Array<{ knowledge_block: string; label: string }>;
}

export const PreviewTableRowRead: React.FC<PreviewTableRowReadProps> = ({
  idx,
  c,
  compositeKey,
  isSelected,
  onStartEdit,
  onDeleteRow,
  knowledgeBlocks,
}) => {
  return (
    <>
      <td
        className={`px-4 py-2 font-bold font-mono ${
          isSelected ? "text-indigo-400" : "text-slate-600"
        }`}
      >
        {c.courseCode}
      </td>
      <td
        className={`px-4 py-2 font-medium ${
          isSelected ? "text-slate-200" : "text-slate-600"
        }`}
      >
        {c.courseName}
      </td>
      <td className="px-4 py-2 text-center font-semibold">{c.credits ?? "-"}</td>
      <td className="px-4 py-2 text-center text-slate-400">{c.theoryHours ?? "-"}</td>
      <td className="px-4 py-2 text-center text-slate-400">{c.practiceHours ?? "-"}</td>
      <td className="px-4 py-2 text-center text-slate-400">{c.projectHours ?? "-"}</td>
      <td className="px-4 py-2 text-center text-slate-400">{c.internshipHours ?? "-"}</td>
      <td className="px-4 py-2">
        <span
          className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
            !isSelected
              ? "bg-slate-850 text-slate-600"
              : c.courseType === "REQUIRED"
              ? "bg-indigo-500/10 text-indigo-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}
        >
          {c.courseType}
        </span>
      </td>
      <td className="px-4 py-2">
        {(() => {
          const badges: Record<string, string> = {
            GENERAL: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
            SECTOR_CORE:
              "bg-orange-500/15 text-orange-300 border border-orange-500/30",
            MAJOR_CORE:
              "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
            SPECIALIZED: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
            INTERNSHIP: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
          };
          const kb = c.knowledgeBlock || "GENERAL";
          const badgeStyle =
            badges[kb] || "bg-slate-500/15 text-slate-300 border border-slate-500/30";
          const found = knowledgeBlocks.find((k) => k.knowledge_block === kb);
          const displayLabel = found ? found.label.toUpperCase() : kb;
          return (
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeStyle}`}
            >
              {displayLabel}
            </span>
          );
        })()}
      </td>
      <td
        className="px-4 py-2 truncate max-w-32 text-slate-400 text-[11px] font-mono"
        title={c.prerequisite || ""}
      >
        {c.prerequisite || "-"}
      </td>
      <td
        className="px-4 py-2 truncate max-w-32 text-slate-400 text-[11px] font-mono"
        title={c.corequisite || ""}
      >
        {c.corequisite || "-"}
      </td>
      <td className="px-4 py-2 text-center text-slate-400">{c.organizingSemester || "-"}</td>
      <td className="px-4 py-2 text-center text-slate-400 font-semibold">
        {c.expectedSemester ?? "-"}
      </td>
      <td className="px-4 py-2 text-center text-slate-400 font-semibold">
        {c.expectedSemester ? Math.ceil(c.expectedSemester / 3) : "-"}
      </td>
      <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onStartEdit(idx, c)}
          className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-850 transition cursor-pointer"
          title="Chỉnh sửa môn học này"
        >
          <Edit2 size={12} />
        </button>
        <button
          type="button"
          onClick={() => onDeleteRow(idx, compositeKey)}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-855 transition cursor-pointer"
          title="Xóa môn học này"
        >
          <Trash2 size={12} />
        </button>
      </td>
    </>
  );
};
