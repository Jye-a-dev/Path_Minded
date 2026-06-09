import React from "react";
import { BookOpen, Award, Calendar } from "lucide-react";

interface DashboardStatsProps {
  creditDisplay: string;
  creditDesc: string;
  cumulativeGpa: number | null;
  cohortYear?: number;
  hasGrades?: boolean;
}

export function DashboardStats({
  creditDisplay,
  creditDesc,
  cumulativeGpa,
  cohortYear,
  hasGrades,
}: DashboardStatsProps) {
  const gpaValue = hasGrades
    ? cumulativeGpa !== null
      ? `${cumulativeGpa.toFixed(2)} / 4.0`
      : "—"
    : "—";

  const gpaDesc = hasGrades
    ? cumulativeGpa !== null
      ? `Xếp loại: ${
          cumulativeGpa >= 3.6
            ? "Xuất sắc"
            : cumulativeGpa >= 3.2
            ? "Giỏi"
            : cumulativeGpa >= 2.5
            ? "Khá"
            : "Trung bình"
        }`
      : "Đang tính toán..."
    : "Chưa tích lũy";

  const stats = [
    {
      label: "Số tín chỉ tích lũy",
      value: creditDisplay,
      icon: <BookOpen className="h-5 w-5 text-violet-600" />,
      desc: creditDesc,
      color: "bg-violet-50 border-violet-100",
    },
    {
      label: "Điểm trung bình (GPA)",
      value: gpaValue,
      icon: <Award className="h-5 w-5 text-emerald-600" />,
      desc: gpaDesc,
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Học kỳ hiện tại",
      value: "HK2 / 2025-2026",
      icon: <Calendar className="h-5 w-5 text-indigo-600" />,
      desc: cohortYear ? `Niên khóa ${cohortYear}` : "Năm thứ 3",
      color: "bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="group flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {stat.label}
            </span>
            <div
              className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform duration-300 ${stat.color}`}
            >
              {stat.icon}
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-neutral-950">
              {stat.value}
            </span>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              {stat.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
