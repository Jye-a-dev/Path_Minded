import { type CourseItem } from "../../../hooks/useCurriculumCourses";
import { Bookmark, Edit2, Trash2 } from "lucide-react";

export const getCurriculumCoursesColumns = (
  handleOpenEdit: (item: CourseItem) => void,
  handleDelete: (id: string) => void
) => [
  {
    header: "Mã môn",
    accessorKey: "course_code",
    render: (row: CourseItem) => (
      <span className="font-mono text-xs font-bold text-slate-200">{row.course_code}</span>
    ),
  },
  {
    header: "Tên môn học",
    accessorKey: "course_name",
    render: (row: CourseItem) => (
      <div className="flex items-center gap-2 min-w-60">
        <Bookmark size={16} className="text-indigo-400 shrink-0" />
        <span className="text-slate-200 font-bold whitespace-nowrap">{row.course_name}</span>
      </div>
    ),
  },
  {
    header: "Số tín chỉ",
    accessorKey: "credits",
    render: (row: CourseItem) => (
      <span className="text-slate-400 font-semibold">{row.credits ?? "N/A"}</span>
    ),
  },
  {
    header: "LT",
    accessorKey: "theory_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.theory_hours ?? "-"}</span>
    ),
  },
  {
    header: "TH",
    accessorKey: "practice_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.practice_hours ?? "-"}</span>
    ),
  },
  {
    header: "ĐA",
    accessorKey: "project_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.project_hours ?? "-"}</span>
    ),
  },
  {
    header: "TT",
    accessorKey: "internship_hours",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.internship_hours ?? "-"}</span>
    ),
  },
  {
    header: "Loại môn",
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
    header: "ĐK tiên quyết",
    accessorKey: "prerequisite",
    render: (row: CourseItem) => (
      <span className="font-mono text-[11px] text-slate-400 block min-w-30 whitespace-nowrap" title={row.prerequisite || ""}>
        {row.prerequisite || "-"}
      </span>
    ),
  },
  {
    header: "Học trước",
    accessorKey: "corequisite",
    render: (row: CourseItem) => (
      <span className="font-mono text-[11px] text-slate-400 block min-w-30 whitespace-nowrap" title={row.corequisite || ""}>
        {row.corequisite || "-"}
      </span>
    ),
  },
  {
    header: "HK tổ chức",
    accessorKey: "organizing_semester",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-medium block">{row.organizing_semester || "-"}</span>
    ),
  },
  {
    header: "Học kỳ",
    accessorKey: "expected_semester",
    render: (row: CourseItem) => (
      <span className="text-slate-400 text-center font-semibold block">{row.expected_semester ?? "N/A"}</span>
    ),
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
