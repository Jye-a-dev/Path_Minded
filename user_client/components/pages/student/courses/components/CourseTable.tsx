import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export interface CourseResult {
  id: string;
  student_id: string;
  course_code: string;
  course_name: string;
  credits?: number;
  score_10?: number | null;
  score_4?: number | null;
  letter_grade?: string | null;
  status: "PASSED" | "FAILED" | "STUDYING" | "NOT_STARTED";
  school_year?: string | null;
  semester_code?: string | null;
  semester_number?: number | null;
  is_latest?: boolean;
}

export function StatusBadge({ status }: { status: CourseResult["status"] }) {
  if (status === "PASSED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-100">
        <CheckCircle2 size={9} /> Đạt
      </span>
    );
  if (status === "FAILED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-red-50 text-red-600 border-red-100">
        <XCircle size={9} /> Rớt
      </span>
    );
  if (status === "STUDYING")
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100">
        <Clock size={9} /> Đang học
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-zinc-50 text-zinc-500 border-zinc-200">
      Chưa học
    </span>
  );
}

export function CourseTable({ courses }: { courses: CourseResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
            <th className="px-4 py-3">Mã môn</th>
            <th className="px-4 py-3">Tên môn học</th>
            <th className="px-4 py-3 text-center">TC</th>
            <th className="px-4 py-3 text-center">Hệ 10</th>
            <th className="px-4 py-3 text-center">Hệ 4</th>
            <th className="px-4 py-3 text-center">Chữ</th>
            <th className="px-4 py-3">Kết quả</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {courses.map((c) => (
            <tr
              key={c.id}
              className="hover:bg-violet-50/20 text-neutral-700 transition-colors"
            >
              <td className="px-4 py-2.5 font-mono font-bold text-violet-600">
                {c.course_code}
              </td>
              <td className="px-4 py-2.5 font-medium text-neutral-800">
                {c.course_name}
              </td>
              <td className="px-4 py-2.5 text-center text-neutral-500">
                {c.credits ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-center font-mono">
                {c.score_10 != null ? Number(c.score_10).toFixed(2) : "—"}
              </td>
              <td className="px-4 py-2.5 text-center font-mono">
                {c.score_4 != null ? Number(c.score_4).toFixed(2) : "—"}
              </td>
              <td className="px-4 py-2.5 text-center font-mono font-bold">
                {c.letter_grade || "—"}
              </td>
              <td className="px-4 py-2.5">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
