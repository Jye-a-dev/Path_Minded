"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f6f4ef] text-neutral-900 antialiased font-sans">
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
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardNavbar
          onMenuClick={() => setSidebarOpen(true)}
          statusLabel={statusLabel}
          statusColor={statusDotColor}
          rightBadge={rightBadge}
        />

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
