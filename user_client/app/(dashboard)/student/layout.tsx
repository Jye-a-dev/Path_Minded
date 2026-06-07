"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import DashboardShell from "@/components/layouts/(dashboard)/DashboardShell";
import {
  LayoutDashboard,
  FileSpreadsheet,
  GraduationCap,
  BookOpen,
  MessageCircle,
} from "lucide-react";

const studentSections = [
  {
    title: "Học tập",
    items: [
      {
        label: "Tổng quan lộ trình",
        to: "/student",
        icon: LayoutDashboard,
      },
      {
        label: "Bảng điểm & Transcript",
        to: "/student/transcripts",
        icon: FileSpreadsheet,
      },
      {
        label: "Môn học đã hoàn thành",
        to: "/student/courses",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Hỗ trợ",
    items: [
      {
        label: "Hồ sơ sinh viên",
        to: "/student/profile",
        icon: GraduationCap,
      },
      {
        label: "Liên hệ Cố vấn",
        to: "/student/advisor",
        icon: MessageCircle,
      },
    ],
  },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "STUDENT") {
      router.replace("/unauthorized");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f6f4ef]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500 animate-pulse">
            Đang xác thực tài khoản...
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "STUDENT") {
    return null;
  }

  return (
    <DashboardShell
      sections={studentSections}
      homeHref="/student"
      roleBadge="Sinh viên"
      accentClass="bg-violet-600"
      activeShadowClass="shadow-lg shadow-violet-600/20"
      accentDotColor="bg-violet-500"
      statusLabel="Cổng thông tin sinh viên"
      statusDotColor="bg-violet-500"
      rightBadge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-600 border border-violet-500/20 select-none">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
          Sinh viên đang hoạt động
        </span>
      }
      footerBrandName="PathMinded – Cổng thông tin Sinh viên"
      footerBrandDesc="Theo dõi tiến độ học tập, cập nhật bảng điểm và lập kế hoạch tốt nghiệp theo lộ trình chuẩn."
      footerLinks={[
        { label: "Trang chủ", href: "/student" },
        { label: "Bảng điểm", href: "/student/transcripts" },
        { label: "Hồ sơ", href: "/student/profile" },
        {
          label: "Hướng dẫn sử dụng",
          href: "https://github.com",
          external: true,
        },
      ]}
      footerBottomLeft={`© ${new Date().getFullYear()} PathMinded Inc. Bảo lưu mọi quyền.`}
      footerBottomRight="Hệ thống tư vấn học tập trực tuyến"
      profileHref="/student/profile"
    >
      {children}
    </DashboardShell>
  );
}
