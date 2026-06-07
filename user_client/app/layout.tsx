import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import "./globals.css";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-[#f6f4ef] text-neutral-900 font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
