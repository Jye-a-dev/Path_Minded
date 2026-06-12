"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, X, ChevronDown } from "lucide-react";

export interface SidebarNavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: { email: string; role: string; display_name?: string | null } | null;
  onLogout: () => void;
  /** Top-level dashboard home link */
  homeHref: string;
  /** Brand badge text e.g. "Sinh viên" */
  roleBadge: string;
  /** Brand badge and active item color */
  accentClass: string;
  /** Active item shadow class */
  activeShadowClass: string;
  sections: SidebarNavSection[];
  /** Optional profile link */
  profileHref?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
  homeHref,
  roleBadge,
  accentClass,
  activeShadowClass,
  sections,
  profileHref,
}) => {
  const pathname = usePathname();

  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const key = `sidebar_collapsed_${roleBadge}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem(
          `sidebar_collapsed_${roleBadge}`,
          JSON.stringify(updated)
        );
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 shadow-xl lg:shadow-none lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:static lg:flex`}
    >
      {/* Brand/Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/70">
        <Link
          href={homeHref}
          className="flex items-center gap-2"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClass} font-bold text-white text-sm shadow-lg`}
          >
            PM
          </div>
          <span className="text-base font-bold tracking-tight text-neutral-900">
            PathMinded{" "}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${accentClass} text-white ml-1`}
            >
              {roleBadge}
            </span>
          </span>
        </Link>
        <button
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-neutral-700 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Home link */}
        <div>
          <Link
            href={homeHref}
            onClick={() => setSidebarOpen(false)}
            className={`hover-primary-accent flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              pathname === homeHref
                ? `${accentClass} text-white ${activeShadowClass}`
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="truncate">Trang chủ</span>
          </Link>
        </div>

        {sections.map((section) => {
          const isCollapsed =
            collapsedSections[section.title] !== undefined
              ? collapsedSections[section.title]
              : !section.items.some((item) => item.to === pathname);
          return (
            <div key={section.title} className="space-y-1.5">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 py-0.5 text-left group cursor-pointer focus:outline-none"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                  {section.title}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed
                    ? "max-h-0 opacity-0"
                    : "max-h-100 opacity-100"
                }`}
              >
                <ul className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          href={item.to}
                          onClick={() => setSidebarOpen(false)}
                          className={`hover-primary-accent flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            isActive
                              ? `${accentClass} text-white ${activeShadowClass}`
                              : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                        >
                          <Icon size={17} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-200/70 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200/80 shadow-sm">
          <Link
            href={profileHref || homeHref}
            className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <User size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-neutral-900">
                {user?.display_name || user?.email}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                {user?.role}
              </p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
