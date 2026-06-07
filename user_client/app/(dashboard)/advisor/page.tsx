"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  FileSpreadsheet, 
  UploadCloud, 
  ArrowRight,
  Layers,
  Settings,
  ShieldAlert
} from "lucide-react";

export default function AdvisorDashboard() {
  const { user } = useAuth();

  // Mock advisor stats
  const stats = [
    {
      label: "Số lớp quản lý",
      value: "4 Lớp học",
      icon: <Users className="h-5 w-5 text-violet-600" />,
      desc: "Tổng cộng 240 sinh viên"
    },
    {
      label: "Yêu cầu nhập khung",
      value: "12 Chương trình",
      icon: <Layers className="h-5 w-5 text-emerald-600" />,
      desc: "Đã chuẩn hóa thành công"
    },
    {
      label: "Báo cáo ma trận đã xuất",
      value: "45 Lượt",
      icon: <FileSpreadsheet className="h-5 w-5 text-indigo-600" />,
      desc: "Định dạng Excel chuẩn VLU"
    }
  ];

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 space-y-8 relative">
      {/* Background glowing effects */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Profile Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold mb-3">
            <ShieldAlert size={13} />
            <span>Cổng thông tin Cố vấn &amp; Giáo vụ</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
            Khu vực làm việc Cố vấn, {user?.display_name || user?.email || "Cố vấn"}!
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Quản lý chương trình đào tạo, chuẩn hóa bảng điểm và xuất các ma trận theo dõi tiến độ sinh viên.
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="group flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-350 hover:-translate-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <div className="p-2.5 bg-neutral-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-extrabold text-neutral-950">
                {stat.value}
              </span>
              <p className="text-xs text-neutral-400 mt-1 font-medium">
                {stat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Card 1: Import Tool */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm flex flex-col justify-between hover:border-violet-300 hover:shadow-md transition-all duration-300">
          <div className="space-y-4">
            <div className="p-3 bg-violet-50 rounded-xl w-fit border border-violet-100">
              <UploadCloud className="h-6 w-6 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Nhập & Chuẩn hóa Khung chương trình
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Tải lên tài liệu Excel khung chương trình đào tạo của khoa. Hệ thống sẽ bóc tách cấu trúc kiến thức, phân loại học phần và kiểm tra điều kiện ràng buộc.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-semibold uppercase">Định dạng hỗ trợ: XLS, XLSX, TXT</span>
            <Link 
              href="/advisor/curriculum"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-500 transition-all cursor-pointer group"
            >
              Truy cập công cụ
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Card 2: Export Reports */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all duration-300">
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl w-fit border border-emerald-100">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900">
              Kết xuất Ma trận Báo cáo Học tập
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Lựa chọn lớp sinh viên cụ thể để xuất báo cáo ma trận (Matrix Excel) hiển thị toàn bộ tiến trình hoàn thành tín chỉ của lớp học.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-semibold uppercase">Tải xuống tức thì trong 3 giây</span>
            <Link 
              href="/advisor/classes"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-all cursor-pointer group"
            >
              Xem danh sách lớp
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Advisory Info Panel */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm relative z-10">
        <h3 className="text-md font-bold text-neutral-950 mb-4 flex items-center gap-2">
          <Settings size={18} className="text-neutral-500" />
          Tiện ích Hệ thống Cố vấn
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          <div className="p-4 rounded-xl bg-neutral-50 border border-zinc-150">
            <h4 className="text-sm font-bold text-neutral-900">Phân quyền tài khoản</h4>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Tài khoản của bạn được cấp quyền `{user?.role}`. Bạn có quyền thao tác với các mô đun nhập liệu học phần, điểm số và quản lý sinh viên.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 border border-zinc-150">
            <h4 className="text-sm font-bold text-neutral-900">Quét dữ liệu lỗi phông</h4>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Các ký tự lỗi font chữ (nếu có) khi copy từ cổng đào tạo cũ sẽ được tự động chuẩn hóa sang bảng mã Unicode dựng sẵn (NFC).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 border border-zinc-150">
            <h4 className="text-sm font-bold text-neutral-900">Lịch sử kết xuất</h4>
            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
              Tất cả các hành động xuất báo cáo ma trận đều được ghi lại vào nhật ký hệ thống để phục vụ công tác giám sát định kỳ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
