"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import DashboardShell from "@/components/layouts/(dashboard)/DashboardShell";
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  FileSpreadsheet,
  BookOpen,
  BarChart3,
  Settings,
  FolderInput,
} from "lucide-react";

const advisorSections = [
  {
    title: "Quản lý",
    items: [
      {
        label: "Tổng quan",
        to: "/advisor",
        icon: LayoutDashboard,
      },
      {
        label: "Danh sách lớp học",
        to: "/advisor/classes",
        icon: Users,
      },
      {
        label: "Sinh viên thuộc lớp",
        to: "/advisor/students",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Nhập & Xuất dữ liệu",
    items: [
      {
        label: "Nhập chương trình",
        to: "/advisor/curriculum",
        icon: UploadCloud,
      },
      {
        label: "Nhập lớp học",
        to: "/advisor/class_imports",
        icon: FolderInput,
      },
      {
        label: "Bảng điểm sinh viên",
        to: "/advisor/transcripts",
        icon: FileSpreadsheet,
      },
      {
        label: "Kết xuất báo cáo ma trận",
        to: "/advisor/exports",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Tiện ích",
    items: [
      {
        label: "Cài đặt hiển thị",
        to: "/advisor/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "ADVISOR" && user.role !== "ADMIN") {
      router.replace("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f4ef]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500 animate-pulse">
            Đang xác thực tài khoản...
          </p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "ADVISOR" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <DashboardShell
      sections={advisorSections}
      homeHref="/advisor"
      roleBadge="Cố vấn"
      accentClass="bg-emerald-600"
      activeShadowClass="shadow-lg shadow-emerald-600/20"
      accentDotColor="bg-emerald-500"
      statusLabel="Cổng Cố vấn học tập"
      statusDotColor="bg-emerald-500"
      rightBadge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-500/20 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Cố vấn đang hoạt động
        </span>
      }
      footerBrandName="PathMinded – Cổng Cố vấn Học tập"
      footerBrandDesc="Công cụ hỗ trợ chuẩn hóa khung chương trình, quản lý bảng điểm và kết xuất ma trận học tập cho toàn lớp."
      footerLinks={[
        { label: "Tổng quan", href: "/advisor" },
        { label: "Lớp học", href: "/advisor/classes" },
        { label: "Nhập khung CT", href: "/advisor/curriculum" },
        {
          label: "Hướng dẫn sử dụng",
          href: "https://github.com",
          external: true,
        },
      ]}
      footerBottomLeft={`© ${new Date().getFullYear()} PathMinded Inc. Bảo lưu mọi quyền.`}
      footerBottomRight="Hệ thống ma trận điều khiển học thuật"
      profileHref="/advisor/profile"
    >
      {children}
    </DashboardShell>
  );
}
