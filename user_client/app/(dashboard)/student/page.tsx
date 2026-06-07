"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  ArrowRight,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Info,
  FileSpreadsheet,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

interface StudentProfile {
  id: string;
  student_code: string;
  full_name: string;
  class_id?: string;
  program_id?: string;
  cohort_year?: number;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  has_grades?: boolean;
}

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingStudent(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) setStudentProfile(res.data[0]);
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoadingStudent(false);
      }
    };
    void fetch();
  }, [user]);

  const stats = [
    {
      label: "Số tín chỉ tích lũy",
      value: studentProfile?.has_grades ? "90 / 120" : "—",
      icon: <BookOpen className="h-5 w-5 text-violet-600" />,
      desc: studentProfile?.has_grades ? "Đã hoàn thành 75%" : "Chưa cập nhật bảng điểm",
      color: "bg-violet-50 border-violet-100",
    },
    {
      label: "Điểm trung bình (GPA)",
      value: studentProfile?.has_grades ? "3.24 / 4.0" : "—",
      icon: <Award className="h-5 w-5 text-emerald-600" />,
      desc: studentProfile?.has_grades ? "Xếp loại: Giỏi" : "Chưa tích lũy",
      color: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Học kỳ hiện tại",
      value: "HK2 / 2025-2026",
      icon: <Calendar className="h-5 w-5 text-indigo-600" />,
      desc: studentProfile?.cohort_year
        ? `Niên khóa ${studentProfile.cohort_year}`
        : "Năm thứ 3",
      color: "bg-indigo-50 border-indigo-100",
    },
  ];

  if (loadingStudent) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải hồ sơ sinh viên...
          </p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-6 w-full">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center text-amber-500">
            <AlertCircle size={36} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Liên kết hồ sơ chưa hoàn tất
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ sinh viên nào
          trong hệ thống. Vui lòng liên hệ Cố vấn Học tập để được hỗ trợ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Subtle ambient gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 pb-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-3">
          <ShieldCheck size={13} />
          <span>Tổng quan Lộ trình Học tập</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
          Chào mừng trở lại, {studentProfile.full_name}!
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Theo dõi tiến độ tích lũy tín chỉ và lộ trình học tập được đề xuất
          theo khung chương trình cá nhân.
        </p>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="group flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {stat.label}
              </span>
              <div
                className={`p-2.5 rounded-xl border group-hover:scale-110 transition-transform duration-300 ${stat.color}`}
              >
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

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left: Recommended roadmap */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-950 mb-4 flex items-center gap-2">
              <GraduationCap className="text-violet-600" size={20} />
              Lộ trình học tập khuyến nghị
            </h2>

            {studentProfile.has_grades ? (
              <>
                <p className="text-sm text-neutral-500 mb-5 leading-relaxed">
                  Dựa trên khung chương trình đào tạo, hệ thống đã phân tích
                  các học phần đã hoàn thành và gợi ý các nhóm môn tiếp theo.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      step: 1,
                      title: "Hoàn thành môn điều kiện (Prerequisites)",
                      desc: "Đăng ký Cấu trúc dữ liệu & Giải thuật trước khi học Cơ sở dữ liệu nâng cao ở học kỳ tới.",
                    },
                    {
                      step: 2,
                      title: "Đăng ký nhóm Tự chọn chuyên ngành",
                      desc: "Chọn tối thiểu 2 môn thuộc nhóm Công nghệ phần mềm (Thiết kế mẫu, Lập trình di động).",
                    },
                    {
                      step: 3,
                      title: "Hoàn tất nhóm Giáo dục đại cương",
                      desc: "Còn 2 môn bắt buộc cần hoàn thành trong học kỳ 2 năm 3.",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-start gap-4 p-4 rounded-xl border border-zinc-150 bg-neutral-50 hover:border-violet-200 hover:bg-violet-50/30 transition-all"
                    >
                      <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                        {item.step}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-neutral-900">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA to courses */}
                <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">
                    Dựa trên dữ liệu bảng điểm đã nạp
                  </span>
                  <Link
                    href="/student/courses"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-500 transition-all group"
                  >
                    Xem toàn bộ môn học
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-500 mb-2">
                  <Info size={24} />
                </div>
                <h4 className="text-sm font-bold text-neutral-800">
                  Chưa có dữ liệu điểm
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Lộ trình học tập chỉ được khởi tạo sau khi bạn nhập bảng
                  điểm vào hệ thống.
                </p>
                <Link
                  href="/student/transcripts"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                >
                  Nhập bảng điểm ngay
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/student/transcripts"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-violet-300 hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">
                  Nhập điểm & Transcript
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tải lên hoặc dán bảng điểm từ cổng đào tạo
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-neutral-300 group-hover:text-violet-500 transition-all group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/student/advisor"
              className="group flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-300"
            >
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900">
                  Liên hệ Cố vấn
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Gửi yêu cầu hỗ trợ từ CVHT của bạn
                </p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-neutral-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>

        {/* Right: Profile card */}
        <div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold text-neutral-950 mb-5 flex items-center gap-2">
              <UserIcon size={16} className="text-violet-600" />
              Hồ sơ sinh viên
            </h3>

            <div className="space-y-4">
              {[
                { label: "Họ và tên", value: studentProfile.full_name },
                {
                  label: "Mã số sinh viên",
                  value: studentProfile.student_code,
                  mono: true,
                },
                { label: "Email liên kết", value: user?.email ?? "" },
              ].map((field) => (
                <div key={field.label}>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {field.label}
                  </span>
                  <p
                    className={`text-sm font-semibold text-neutral-900 mt-0.5 ${field.mono ? "font-mono" : ""}`}
                  >
                    {field.value}
                  </p>
                </div>
              ))}
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Trạng thái
                </span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      studentProfile.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : studentProfile.status === "GRADUATED"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : "bg-red-50 text-red-700 border-red-100"
                    }`}
                  >
                    <CheckCircle2 size={11} />
                    {studentProfile.status === "ACTIVE"
                      ? "Đang học"
                      : studentProfile.status === "GRADUATED"
                        ? "Đã tốt nghiệp"
                        : "Đã thôi học"}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-100">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Phát hiện sai lệch thông tin? Liên hệ CVHT của lớp để kiểm
                tra và chỉnh sửa.
              </p>
              <Link
                href="/student/profile"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-500 transition-colors"
              >
                Xem hồ sơ đầy đủ
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
