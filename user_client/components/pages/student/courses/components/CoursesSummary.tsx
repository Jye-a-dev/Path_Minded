import React from "react";
import { CheckCircle2, XCircle, BookOpen } from "lucide-react";

interface CoursesSummaryProps {
  passed: number;
  failed: number;
  totalCredits: number;
}

export function CoursesSummary({
  passed,
  failed,
  totalCredits,
}: CoursesSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          label: "Đã đạt",
          value: passed,
          icon: <CheckCircle2 size={18} className="text-emerald-600" />,
          color: "bg-emerald-50 border-emerald-100 text-emerald-700",
        },
        {
          label: "Không đạt",
          value: failed,
          icon: <XCircle size={18} className="text-red-500" />,
          color: "bg-red-50 border-red-100 text-red-700",
        },
        {
          label: "Tín chỉ tích lũy",
          value: totalCredits,
          icon: <BookOpen size={18} className="text-violet-600" />,
          color: "bg-violet-50 border-violet-100 text-violet-700",
        },
      ].map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 p-4 rounded-2xl border ${s.color}`}
        >
          {s.icon}
          <div>
            <p className="text-xl font-extrabold">{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              {s.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
