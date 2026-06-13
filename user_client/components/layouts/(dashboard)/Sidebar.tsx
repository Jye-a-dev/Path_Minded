"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, User, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

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

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("sidebar_collapsed_user") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_collapsed_user", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

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
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300 shadow-xl lg:shadow-none lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
      } lg:static lg:flex ${isCollapsed ? "lg:w-20" : "lg:w-72"}`}
    >
      {/* Brand/Logo */}
      <div className={`flex h-16 items-center border-b border-slate-200/70 transition-all duration-300 ${
        isCollapsed ? "lg:flex-col lg:h-auto lg:py-3 lg:gap-2 lg:justify-center lg:px-2" : "justify-between px-6"
      }`}>
        <Link
          href={homeHref}
          className="flex items-center gap-2"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accentClass} font-bold text-white text-sm shadow-lg`}
          >
            PM
          </div>
          <span className={`text-base font-bold tracking-tight text-neutral-900 transition-all duration-300 whitespace-nowrap ${
            isCollapsed ? "lg:hidden" : ""
          }`}>
            PathMinded{" "}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${accentClass} text-white ml-1`}
            >
              {roleBadge}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-neutral-700 transition-colors cursor-pointer"
            title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          >
            {isCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          {!isCollapsed && (
            <button
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-neutral-700 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-5 space-y-5 transition-all duration-300 ${
        isCollapsed ? "px-2" : "px-4"
      }`}>
        {/* Home link */}
        <div>
          <Link
            href={homeHref}
            onClick={() => setSidebarOpen(false)}
            className={`hover-primary-accent flex items-center gap-3 rounded-lg py-2 text-sm font-semibold transition-all ${
              isCollapsed ? "lg:justify-center lg:px-0" : "px-3"
            } ${
              pathname === homeHref
                ? `${accentClass} text-white ${activeShadowClass}`
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title={isCollapsed ? "Trang chủ" : undefined}
          >
            <span className={`truncate transition-all duration-305 ${isCollapsed ? "lg:hidden" : ""}`}>Trang chủ</span>
          </Link>
        </div>

        {sections.map((section) => {
          const isSectionCollapsed = isCollapsed
            ? false
            : (collapsedSections[section.title] !== undefined
              ? collapsedSections[section.title]
              : !section.items.some((item) => item.to === pathname));
          return (
            <div key={section.title} className="space-y-1.5">
              {isCollapsed ? (
                <div className="border-t border-slate-200/60 my-4 mx-2" title={section.title} />
              ) : (
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
                      isSectionCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                  />
                </button>
              )}

              <div
                className={`transition-all duration-300 ease-in-out ${
                  isCollapsed
                    ? "opacity-100"
                    : (isSectionCollapsed ? "max-h-0 opacity-0 overflow-hidden" : "max-h-100 opacity-100")
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
                          className={`hover-primary-accent flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all ${
                            isCollapsed ? "lg:justify-center lg:px-0" : "px-3"
                          } ${
                            isActive
                              ? `${accentClass} text-white ${activeShadowClass}`
                              : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon size={17} className="shrink-0" />
                          <span className={`truncate transition-all duration-350 ${isCollapsed ? "lg:hidden" : ""}`}>
                            {item.label}
                          </span>
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
      <div className={`border-t border-slate-200/70 bg-slate-50/60 transition-all duration-300 ${
        isCollapsed ? "p-2" : "p-4"
      }`}>
        <div className={`flex items-center justify-between rounded-xl bg-white border border-slate-200/80 shadow-sm transition-all duration-300 ${
          isCollapsed ? "flex-col p-2 gap-3" : "p-3"
        }`}>
          <Link
            href={profileHref || homeHref}
            className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
            title={isCollapsed ? (user?.display_name || user?.email || "") : undefined}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <User size={18} />
            </div>
            <div className={`min-w-0 flex-1 transition-all duration-300 ${isCollapsed ? "lg:hidden" : ""}`}>
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
            className={`rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-rose-500 cursor-pointer ${
              isCollapsed ? "w-full flex justify-center" : ""
            }`}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
