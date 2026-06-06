import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AuthProvider } from "@/providers/AuthProvider";
import PublicSetup from "@/components/layouts/(public)/PublicSetup";

import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Path_Minded - Chuẩn hóa & Phân tích Đào tạo VLU",
  description: "Hệ thống hỗ trợ quản lý giáo dục, phân tích dữ liệu học tập và chuẩn hóa chương trình đào tạo sinh viên Đại học Văn Lang (VLU).",
};

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-[#f6f4ef] text-neutral-900 font-sans">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-350 flex-col border-x border-neutral-200 bg-white">
            <PublicSetup>{children}</PublicSetup>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
