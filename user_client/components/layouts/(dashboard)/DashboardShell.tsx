"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/providers/SettingsContext";
import { Sidebar, SidebarNavSection } from "./Sidebar";
import DashboardNavbar from "./Navbar";
import DashboardFooter from "./Footer";

interface DashboardShellProps {
  children: React.ReactNode;
  /** Sidebar sections */
  sections: SidebarNavSection[];
  /** Home link for the brand logo */
  homeHref: string;
  /** e.g. "Sinh viên" | "Cố vấn" */
  roleBadge: string;
  /** Tailwind bg class for accent e.g. "bg-violet-600" */
  accentClass: string;
  activeShadowClass: string;
  accentDotColor: string;
  /** Navbar status label */
  statusLabel: string;
  statusDotColor: string;
  /** Navbar right badge */
  rightBadge?: React.ReactNode;
  /** Footer props */
  footerBrandName: string;
  footerBrandDesc: string;
  footerLinks?: { label: string; href: string; external?: boolean }[];
  footerBottomLeft?: string;
  footerBottomRight?: string;
  profileHref?: string;
}

export default function DashboardShell({
  children,
  sections,
  homeHref,
  roleBadge,
  accentClass,
  activeShadowClass,
  accentDotColor,
  statusLabel,
  statusDotColor,
  rightBadge,
  footerBrandName,
  footerBrandDesc,
  footerLinks = [],
  footerBottomLeft,
  footerBottomRight,
  profileHref,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen bg-[#f6f4ef] text-neutral-900 antialiased font-sans overflow-hidden theme-bg-main">
      <style>{`
        /* Dynamic Theme Overrides */
        :root {
          --theme-bg-val: var(--theme-bg, #f6f4ef);
          --theme-bg-deep-val: var(--theme-bg-deep, #eae6df);
          --theme-bg-card-val: var(--theme-bg-card, rgba(255, 255, 255, 0.8));
          --theme-border-val: var(--theme-border, rgba(226, 232, 240, 0.8));
          --primary-val: var(--primary-color, #059669);
          --primary-hover-val: var(--primary-hover, #047857);
          --primary-light-val: var(--primary-light, #34d399);
          --theme-text-val: var(--theme-text, #334155);
          --theme-text-muted-val: var(--theme-text-muted, #64748b);
          --theme-text-title-val: var(--theme-text-title, #0f172a);
          --theme-bg-btn-val: var(--theme-bg-btn, #e2e8f0);
          --theme-bg-mid-val: var(--theme-bg-mid, #f1f5f9);
        }

        /* 1. Global background overrides */
        body, .theme-bg-main, .bg-background {
          background-color: var(--theme-bg-val) !important;
          color: var(--theme-text-val) !important;
        }

        /* 2. Card and panel overrides */
        .bg-white, .bg-white\\/95, aside, .bg-slate-50\\/60, .bg-slate-900\\/45, .bg-slate-900\\/40 {
          background-color: var(--theme-bg-card-val) !important;
        }

        /* 3. Highlight boxes and secondary panels */
        .bg-neutral-50, .bg-neutral-50\\/50, .bg-neutral-100, .bg-slate-50, .bg-slate-100, .bg-slate-100\\/80 {
          background-color: var(--theme-bg-mid-val) !important;
        }

        /* 4. Border overrides */
        .border-slate-200, .border-slate-200\\/80, .border-slate-200\\/70,
        .border-zinc-200, .border-zinc-300, .border-zinc-150, .border-zinc-100, .border-zinc-250,
        .border-neutral-200\\/80, .border-neutral-300, .border-neutral-300\\/70 {
          border-color: var(--theme-border-val) !important;
        }

        /* 5. Text overrides */
        .text-neutral-950, .text-neutral-900, .text-neutral-800, .text-neutral-700, .text-neutral-600, .text-slate-900, .text-slate-800, .text-zinc-900, .text-zinc-950 {
          color: var(--theme-text-val) !important;
        }
        .text-neutral-500, .text-neutral-400, .text-slate-500, .text-slate-400 {
          color: var(--theme-text-muted-val) !important;
        }
        h1, h2, h3, h4, h5, h6 {
          color: var(--theme-text-title-val) !important;
        }
        /* Exceptions: Keep text white in primary accent buttons, role tags, or badges */
        .bg-emerald-600 *, .bg-violet-600 *, .bg-indigo-600 *,
        .bg-emerald-600, .bg-violet-600, .bg-indigo-600,
        .text-white, .text-white * {
          color: #ffffff !important;
        }

        /* 6. Form elements and inputs overrides */
        input, select, textarea {
          background-color: var(--theme-bg-btn-val) !important;
          color: var(--theme-text-val) !important;
          border-color: var(--theme-border-val) !important;
        }
        input::placeholder, select::placeholder, textarea::placeholder {
          color: var(--theme-text-muted-val) !important;
          opacity: 0.7;
        }

        /* 7. Accent colors overrides */
        .bg-emerald-600, .bg-violet-600, .bg-indigo-600 {
          background-color: var(--primary-val) !important;
        }
        .hover\\:bg-emerald-55:hover, .hover\\:bg-violet-550:hover, .hover\\:bg-emerald-550:hover,
        .hover\\:bg-violet-500:hover, .hover\\:bg-emerald-500:hover, .hover\\:bg-indigo-500:hover,
        .hover\\:bg-slate-100:hover, .hover\\:bg-slate-100\\/80:hover {
          background-color: var(--primary-hover-val) !important;
          opacity: 0.95 !important;
        }
        .text-emerald-600, .text-violet-600, .text-indigo-600, .text-emerald-700, .text-violet-700 {
          color: var(--primary-val) !important;
        }
        .text-emerald-500, .text-violet-500, .text-indigo-500 {
          color: var(--primary-light-val) !important;
        }
        .border-emerald-500\\/20, .border-violet-500\\/20, .border-indigo-500\\/20 {
          border-color: rgba(var(--primary-rgb), 0.25) !important;
        }
        .bg-emerald-500\\/10, .bg-violet-500\\/10, .bg-indigo-500\\/10 {
          background-color: rgba(var(--primary-rgb), 0.1) !important;
        }
        .bg-emerald-500\\/20, .bg-violet-500\\/20, .bg-indigo-500\\/20 {
          background-color: rgba(var(--primary-rgb), 0.15) !important;
        }
        
        /* 8. Dark mode specific overrides */
        .dark .bg-slate-50\\/60, .dark .bg-slate-50, .dark .bg-neutral-50, .dark .bg-neutral-100 {
          background-color: var(--theme-bg-mid-val) !important;
        }
        .dark .text-slate-500, .dark .text-neutral-500, .dark .text-slate-400, .dark .text-neutral-400 {
          color: var(--theme-text-muted-val) !important;
        }
        .dark .hover\\:bg-slate-100\\/80:hover,
        .dark .hover\\:bg-slate-100:hover,
        .dark .hover\\:bg-neutral-100:hover,
        .dark .hover\\:bg-neutral-50:hover,
        .dark .hover\\:bg-neutral-50\\/30:hover,
        .dark .hover\\:bg-slate-50:hover,
        .dark .hover\\:bg-zinc-50:hover,
        .dark .hover\\:bg-zinc-100:hover {
          background-color: var(--theme-bg-btn-val) !important;
          color: var(--theme-text-title-val) !important;
        }

        /* 9. Compact tables overrides */
        .compact-tables td, .compact-tables th {
          padding-top: 0.35rem !important;
          padding-bottom: 0.35rem !important;
          font-size: 0.8rem !important;
        }

        /* 10. Glassmorphism UI */
        .glass-ui aside {
          backdrop-blur: 12px !important;
          background-color: rgba(255, 255, 255, 0.45) !important;
        }
        .dark.glass-ui aside {
          background-color: rgba(15, 23, 42, 0.45) !important;
        }
      `}</style>

      {/* Mesh Glow Background */}
      {settings.meshGradient && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-15">
          <div className="absolute top-[-30%] left-[-20%] h-[70%] w-[60%] rounded-full bg-emerald-500/35 blur-[120px] dark:bg-emerald-500/20" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[50%] rounded-full bg-violet-500/25 blur-[120px] dark:bg-violet-500/15" />
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
        homeHref={homeHref}
        roleBadge={roleBadge}
        accentClass={accentClass}
        activeShadowClass={activeShadowClass}
        sections={sections}
        profileHref={profileHref}
      />

      {/* Main body */}
      <div className="flex flex-1 flex-col overflow-hidden z-10">
        {settings.showNavbar && (
          <DashboardNavbar
            onMenuClick={() => setSidebarOpen(true)}
            statusLabel={statusLabel}
            statusColor={statusDotColor}
            rightBadge={rightBadge}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between">
          <div className="flex-1 max-w-5xl w-full mx-auto pb-8">
            {children}
          </div>

          <DashboardFooter
            brandName={footerBrandName}
            brandDescription={footerBrandDesc}
            accentDotColor={accentDotColor}
            links={footerLinks}
            bottomLeftText={footerBottomLeft}
            bottomRightText={footerBottomRight}
          />
        </main>
      </div>
    </div>
  );
}
