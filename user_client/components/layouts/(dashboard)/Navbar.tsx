"use client";

import React from "react";
import { Menu } from "lucide-react";

interface DashboardNavbarProps {
  onMenuClick: () => void;
  statusLabel: string;
  statusColor: string; // e.g. "bg-violet-500"
  rightBadge?: React.ReactNode;
}

export default function DashboardNavbar({
  onMenuClick,
  statusLabel,
  statusColor,
  rightBadge,
}: DashboardNavbarProps) {
  return (
    <div className="relative pt-4 px-4 md:px-6 shrink-0 z-30 select-none">
      <header className="relative w-full max-w-5xl mx-auto rounded-2xl border border-neutral-200/80 bg-white/80 shadow-sm px-5 py-3 backdrop-blur-md flex items-center justify-between transition-all hover:border-neutral-300/70 hover:shadow-md">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-neutral-700 lg:hidden"
            onClick={onMenuClick}
            aria-label="Mở menu điều hướng"
          >
            <Menu size={20} />
          </button>
          <div className="hidden items-center gap-2 rounded-full bg-slate-100/70 px-3 py-1 border border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500 sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor} animate-pulse`} />
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {rightBadge}
        </div>
      </header>
    </div>
  );
}
