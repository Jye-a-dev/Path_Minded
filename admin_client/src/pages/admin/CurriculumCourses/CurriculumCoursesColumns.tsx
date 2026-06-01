import { type CourseItem } from "../../../hooks/useCurriculumCourses";
import { type GetLabelFn } from "../../../hooks/useColumnLabels";
import { Bookmark, Edit2, Trash2 } from "lucide-react";

export const getCurriculumCoursesColumns = (
  handleOpenEdit: (item: CourseItem) => void,
  handleDelete: (id: string) => void,
  knowledgeBlocks: Array<{ id: string; label: string }> = [],
  getLabel: GetLabelFn = (k, f) => f ?? k
) => [
  {
    header: getLabel("course_code", "Mã môn"),
    accessorKey: "course_code",
    render: (row: CourseItem) => (
      <span className="font-mono text-xs font-bold text-slate-200">{row.course_code}</span>
    ),
  },
  {
    header: getLabel("course_name", "Tên môn học"),
    accessorKey: "course_name",
    render: (row: CourseItem) => (
      <div className="flex items-center gap-2 min-w-60">
        <Bookmark size={16} className="text-indigo-400 shrink-0" />
        <span className="text-slate-200 font-bold whitespace-nowrap">{row.course_name}</span>
      </div>
    ),
  },
  {
    header: getLabel("credits", "Số tín chỉ"),
    accessorKey: "credits",
    render: (row: CourseItem) => (
      <span className="text-slate-400 font-semibold">{row.credits ?? "N/A"}</span>
    ),
  },
  {
    header: getLabel("theory_hours", "LT"),
    accessorKey: "theory_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.theory_hours ?? "-"}</span>
    ),
  },
  {
    header: getLabel("practice_hours", "TH"),
    accessorKey: "practice_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.practice_hours ?? "-"}</span>
    ),
  },
  {
    header: getLabel("project_hours", "ĐA"),
    accessorKey: "project_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.project_hours ?? "-"}</span>
    ),
  },
  {
    header: getLabel("internship_hours", "TT"),
    accessorKey: "internship_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.internship_hours ?? "-"}</span>
    ),
  },
  {
    header: getLabel("course_type", "Loại môn"),
    accessorKey: "course_type",
    render: (row: CourseItem) => {
      const badges = {
        REQUIRED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        ELECTIVE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        PE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        ENGLISH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        DEFENSE: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        OTHER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
      const statusMap = {
        REQUIRED: "BẮT BUỘC",
        ELECTIVE: "TỰ CHỌN",
        PE: "THỂ CHẤT",
        ENGLISH: "TIẾNG ANH",
        DEFENSE: "QUỐC PHÒNG",
        OTHER: "KHÁC",
      };
      return (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.course_type]}`}
        >
          {statusMap[row.course_type]}
        </span>
      );
    },
  },
  {
    header: getLabel("knowledge_block", "Khối kiến thức"),
    accessorKey: "knowledge_block",
    render: (row: CourseItem) => {
      const badges: Record<string, string> = {
        GENERAL: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
        SECTOR_CORE: "bg-orange-500/15 text-orange-300 border-orange-500/30",
        MAJOR_CORE: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        SPECIALIZED: "bg-sky-500/15 text-sky-300 border-sky-500/30",
        INTERNSHIP: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      };
      const kb = row.knowledge_block;
      if (!kb) return <span className="text-slate-600 font-medium">-</span>;

      const badgeStyle = badges[kb] || "bg-slate-500/15 text-slate-300 border-slate-500/30";
      const found = knowledgeBlocks.find((k) => k.id === kb);
      const displayLabel = found ? found.label.toUpperCase() : kb;

      return (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badgeStyle}`}
        >
          {displayLabel}
        </span>
      );
    },
  },
  {
    header: getLabel("prerequisite", "ĐK tiên quyết"),
    accessorKey: "prerequisite",
    render: (row: CourseItem) => (
      <span className="font-mono text-[11px] text-slate-400 block min-w-30 whitespace-nowrap" title={row.prerequisite || ""}>
        {row.prerequisite || "-"}
      </span>
    ),
  },
  {
    header: getLabel("corequisite", "Học trước"),
    accessorKey: "corequisite",
    render: (row: CourseItem) => (
      <span className="font-mono text-[11px] text-slate-400 block min-w-30 whitespace-nowrap" title={row.corequisite || ""}>
        {row.corequisite || "-"}
      </span>
    ),
  },
  {
    header: getLabel("organizing_semester", "HK tổ chức"),
    accessorKey: "organizing_semester",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.organizing_semester || "-"}</span>
    ),
  },
  {
    header: getLabel("expected_semester", "Học kỳ"),
    accessorKey: "expected_semester",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-semibold block">{row.expected_semester ?? "N/A"}</span>
    ),
  },
  {
    header: "Năm thứ",
    accessorKey: "expected_year",
    render: (row: CourseItem) => {
      const year = row.expected_semester ? Math.ceil(row.expected_semester / 3) : null;
      return (
        <span className="text-slate-400 text-center font-semibold block">{year ?? "-"}</span>
      );
    },
  },
  {
    header: "Yêu cầu",
    accessorKey: "is_required",
    render: (row: CourseItem) => (
      <span className={`text-xs font-semibold ${row.is_required ? "text-emerald-400" : "text-slate-500"}`}>
        {row.is_required ? "Có" : "Không"}
      </span>
    ),
  },
  {
    header: "Thao tác",
    accessorKey: "actions",
    render: (row: CourseItem) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleOpenEdit(row)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => handleDelete(row.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    ),
  },
];
