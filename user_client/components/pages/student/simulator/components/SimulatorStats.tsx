import React from "react";
import { Award, BookOpen, TrendingUp } from "lucide-react";

interface SimulatorStatsProps {
  currentCumulativeGpa: number;
  currentPassedCredits: number;
  totalCurriculumCredits: number;
  remainingCredits: number;
  simulatedGpa: number;
  simulatedCredits: number;
}

export function SimulatorStats({
  currentCumulativeGpa,
  currentPassedCredits,
  totalCurriculumCredits,
  remainingCredits,
  simulatedGpa,
  simulatedCredits,
}: SimulatorStatsProps) {
  const gpaClassification =
    currentCumulativeGpa >= 3.6
      ? "Xuất sắc"
      : currentCumulativeGpa >= 3.2
      ? "Giỏi"
      : currentCumulativeGpa >= 2.5
      ? "Khá"
      : "Trung bình";

  const progressPercentage = totalCurriculumCredits > 0 
    ? Math.min(100, (currentPassedCredits / totalCurriculumCredits) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">GPA Hiện tại</span>
          <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
            <Award size={18} />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold text-neutral-900">{currentCumulativeGpa.toFixed(2)}</span>
          <span className="text-sm text-neutral-400 font-medium ml-1">/ 4.0</span>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Xếp loại tích lũy: <span className="font-bold text-emerald-600">
              {gpaClassification}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tín chỉ hoàn thành</span>
          <div className="p-2 bg-violet-50 border border-violet-100 text-violet-600 rounded-xl">
            <BookOpen size={18} />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold text-neutral-900">{currentPassedCredits}</span>
          <span className="text-sm text-neutral-400 font-medium ml-1">/ {totalCurriculumCredits} TC</span>
          <div className="mt-2 w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-violet-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
            Còn lại {remainingCredits} tín chỉ cần hoàn tất
          </p>
        </div>
      </div>

      <div className="bg-linear-to-br from-violet-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <span className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">GPA Giả lập live</span>
          <div className="p-2 bg-white/10 border border-white/20 text-white rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <span className="text-3xl font-extrabold">{simulatedGpa.toFixed(2)}</span>
          <span className="text-sm text-violet-200 font-medium ml-1">/ 4.0</span>
          <p className="text-xs text-violet-100 mt-1 font-medium">
            Tính trên tổng <span className="font-bold">{simulatedCredits} TC</span> (bao gồm điểm giả lập)
          </p>
        </div>
      </div>
    </div>
  );
}
