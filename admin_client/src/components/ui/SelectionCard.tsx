import React from "react";
import { Loader2 } from "lucide-react";

interface SelectionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  icon,
  title,
  description,
  loading = false,
  loadingText = "Đang tải...",
  children,
}) => {
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[65vh]">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            {icon}
          </div>
          <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">{title}</h2>
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs relative z-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span>{loadingText}</span>
          </div>
        ) : (
          <div className="mt-8 space-y-6 relative z-10">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
