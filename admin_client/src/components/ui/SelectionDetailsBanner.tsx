import React from "react";

interface SelectionDetailsBannerProps {
  icon: React.ReactNode;
  badge?: string;
  title: string | React.ReactNode;
  description: string;
  buttonText?: string;
  onClear: () => void;
  rightActions?: React.ReactNode;
}

export const SelectionDetailsBanner: React.FC<SelectionDetailsBannerProps> = ({
  icon,
  badge,
  title,
  description,
  buttonText = "Thay đổi",
  onClear,
  rightActions,
}) => {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
      <div className="flex items-center gap-3.5">
        <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {badge && (
              <span className="font-mono text-xs font-bold text-indigo-400 tracking-wide uppercase bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                {badge}
              </span>
            )}
            {typeof title === "string" ? (
              <span className="text-sm font-bold text-slate-200">{title}</span>
            ) : (
              title
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {rightActions}
        <button
          onClick={onClear}
          className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition-all cursor-pointer text-center"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};
