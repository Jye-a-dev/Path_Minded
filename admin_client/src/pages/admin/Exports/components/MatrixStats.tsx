import React from "react";

interface MatrixStatsProps {
  stats: {
    passed: number;
    studying: number;
    failed: number;
  };
}

export const MatrixStats: React.FC<MatrixStatsProps> = ({ stats }) => {
  return (
    <div className="hidden sm:flex items-center gap-3 ml-4">
      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-black border border-emerald-600">
        ✓ {stats.passed} Qua
      </span>
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-black border border-amber-500">
        ↻ {stats.studying} Đang học
      </span>
      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-black border border-rose-500">
        ✗ {stats.failed} Rớt
      </span>
    </div>
  );
};
