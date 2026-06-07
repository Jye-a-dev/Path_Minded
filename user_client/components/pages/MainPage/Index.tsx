"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  Search,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  HelpCircle,
  GraduationCap,
} from "lucide-react";

export default function MainPage() {
  const { isAuthenticated } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const coreSolutions = [
    {
      icon: <FileText className="h-6 w-6 text-violet-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />,
      title: "Xử lý & Nhập liệu thông minh",
      description: "Hỗ trợ nhập dữ liệu linh hoạt từ các nguồn phi cấu trúc như văn bản thô hoặc tệp Excel bảng điểm sinh viên, khung chương trình đào tạo và danh sách lớp học.",
    },
    {
      icon: <Search className="h-6 w-6 text-violet-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />,
      title: "Chuẩn hóa & Nhận diện tự động",
      description: "Tự động nhận diện cấu trúc bảng điểm, bóc tách mã/tên môn học song ngữ, số tín chỉ và chuẩn hóa bảng mã Unicode từ các nguồn dữ liệu trực tuyến.",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-violet-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />,
      title: "Phân loại & Lộ trình tối ưu",
      description: "Tự động phân loại nhóm môn học (Bắt buộc, Tự chọn, Giáo dục thể chất, Quốc phòng) và xây dựng bản đồ quan hệ môn học điều kiện tiên quyết/song hành.",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6 text-violet-600 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />,
      title: "Báo cáo ma trận trực quan",
      description: "Tính toán và kết xuất dữ liệu kết quả học tập dưới dạng ma trận Excel (Matrix Excel) trực quan giúp cố vấn học tập quản lý tổng quan tiến độ của lớp.",
    },
  ];

  const faqs = [
    {
      question: "Hệ thống hỗ trợ nhập dữ liệu từ những định dạng nào?",
      answer: "Hệ thống hỗ trợ tải lên trực tiếp các tệp Excel chứa bảng điểm học tập, danh sách lớp hoặc sao chép và dán trực tiếp đoạn văn bản thô từ trang thông tin đào tạo của trường học.",
    },
    {
      question: "Hệ thống xử lý lỗi phông chữ và định dạng bảng điểm sao chép trực tiếp như thế nào?",
      answer: "Hệ thống tự động chuẩn hóa bảng mã Unicode (NFC), loại bỏ khoảng trắng thừa và sử dụng thuật toán phân tách cột thông minh dựa trên định dạng bảng đào tạo để nhận diện chính xác thông tin môn học và điểm số.",
    },
    {
      question: "Lộ trình học tập khuyến nghị và điều kiện môn học hoạt động ra sao?",
      answer: "Hệ thống phân tích các môn học điều kiện tiên quyết hoặc song hành của khung chương trình, đối chiếu với điểm số thực tế để đưa ra cảnh báo sớm nếu sinh viên có nguy cơ trễ hạn tốt nghiệp.",
    },
    {
      question: "Làm thế nào để xuất báo cáo ma trận (Matrix Excel) kết quả lớp học?",
      answer: "Cố vấn học tập và giáo vụ chỉ cần chọn lớp học tương ứng, hệ thống sẽ tổng hợp tiến độ tích lũy tín chỉ của tất cả sinh viên và xuất ra một tệp Excel định dạng ma trận chuẩn quy định.",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#f6f4ef] text-neutral-900 overflow-hidden animate-fade-in">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 lg:px-8 flex flex-col items-center text-center overflow-hidden">
        {/* Tech Grid Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] opacity-40 pointer-events-none" />

        {/* Soft pulsing background glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-137.5 h-65 bg-linear-to-tr from-violet-500/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
        <div className="absolute top-40 right-10 w-75 h-75 bg-purple-400/5 rounded-full blur-[80px] pointer-events-none animate-float" />
        <div className="absolute top-20 left-10 w-62.5 h-62.5 bg-indigo-400/5 rounded-full blur-[70px] pointer-events-none animate-float-delayed" />

        <div className="relative max-w-4xl flex flex-col items-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-violet-100/80 text-violet-700 text-xs sm:text-sm font-bold mb-8 shadow-sm hover:scale-[1.02] transition-transform duration-300">
            <Sparkles size={14} className="animate-pulse text-violet-600" />
            <span>Đồng hành cùng Chương trình Đào tạo Đại học Văn Lang (VLU)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-neutral-950 leading-tight animate-fade-up">
            Phân tích Dữ liệu Học tập & <br />
            <span className="bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
              Chuẩn hóa Chương trình
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-3xl leading-relaxed animate-fade-up [animation-delay:200ms]">
            Path_Minded là hệ thống hỗ trợ quản lý giáo dục, phân tích dữ liệu học tập và chuẩn hóa chương trình đào tạo cho sinh viên Đại học Văn Lang (VLU), giúp tối ưu hóa lộ trình học tập và kết xuất ma trận kết quả học tập nhanh chóng.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms]">
            {isAuthenticated ? (
              <Link
                href="/me"
                className="flex items-center gap-2 rounded-xl bg-neutral-950 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-neutral-950/20 hover:bg-neutral-800 hover:shadow-2xl hover:shadow-violet-600/10 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              >
                Vào cổng thông tin
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-neutral-950 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-neutral-950/20 hover:bg-neutral-800 hover:shadow-2xl hover:shadow-violet-600/10 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
              >
                Bắt đầu ngay
                <ArrowRight size={16} />
              </Link>
            )}
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-neutral-300/80 bg-white/90 backdrop-blur-md px-8 py-4 text-sm font-semibold text-neutral-700 hover:bg-white hover:border-violet-300 hover:text-neutral-900 shadow-sm transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
            >
              Tìm hiểu tính năng
            </a>
          </div>
        </div>

        {/* Dynamic & Animated Mockup inside the hero */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-neutral-300 bg-white/95 backdrop-blur-md p-4 shadow-2xl relative overflow-hidden group/mockup animate-float transition-shadow hover:shadow-violet-500/10 duration-500">
          {/* Top Window Bar */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-neutral-100/80 border-b border-neutral-200/50 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
            <div className="w-3 h-3 rounded-full bg-green-400/80" />
            <div className="mx-auto text-xs text-neutral-500 font-mono select-none">pathminded.vlu.edu.vn/matrix-view</div>
          </div>

          <div className="mt-8 pt-4 px-2 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {/* Box 1 */}
            <div className="rounded-xl border border-neutral-200/70 p-5 bg-[#fbfaf8] hover:border-violet-300 hover:bg-white transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100/50">Chuẩn hóa dữ liệu</span>
                <span className="text-[10px] text-neutral-400 font-medium">100% Thành công</span>
              </div>
              <h3 className="font-bold text-neutral-900 line-clamp-2 text-sm">Khung chương trình đào tạo & Bảng điểm sinh viên</h3>
              <p className="text-xs text-neutral-500 mt-3 font-medium">✨ Đã chuẩn hóa phông chữ & Unicode</p>
              <p className="text-xs text-neutral-500 font-medium">📋 Tự động bóc tách Mã môn & Tín chỉ</p>
              <div className="mt-4 bg-neutral-150 rounded-full h-1.5 w-full overflow-hidden">
                <div className="bg-linear-to-r from-violet-500 to-indigo-500 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Box 2 */}
            <div className="rounded-xl border border-neutral-200/70 p-5 bg-[#fbfaf8] hover:border-emerald-300 hover:bg-white transition-all duration-300 hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">Lộ trình khuyến nghị</span>
                <span className="text-[10px] text-neutral-400 font-medium">Theo dõi tiến độ</span>
              </div>
              <h3 className="font-bold text-neutral-900 line-clamp-2 text-sm">Bản đồ điều kiện môn học tiên quyết & song hành</h3>
              <p className="text-xs text-neutral-500 mt-3 font-medium">🔗 Phân loại: Bắt buộc & Tự chọn</p>
              <p className="text-xs text-neutral-500 font-medium">⚠️ Cảnh báo sớm trễ hạn môn học</p>
              <div className="mt-4 bg-neutral-150 rounded-full h-1.5 w-full overflow-hidden">
                <div className="bg-linear-to-r from-emerald-400 to-teal-500 h-full rounded-full w-4/5" />
              </div>
            </div>

            {/* Box 3 */}
            <div className="rounded-xl border border-neutral-200/70 p-5 bg-[#fbfaf8] hover:border-indigo-300 hover:bg-white transition-all duration-300 hover:shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Xuất bản báo cáo gần đây</h4>
                <div className="mt-3 space-y-3">
                  <div className="text-xs border-l-2 border-violet-500 pl-3 py-0.5 hover:bg-violet-50/40 rounded-r transition-colors duration-200 cursor-pointer">
                    <p className="font-bold text-neutral-800">Ma trận kết quả lớp K30-CNTT</p>
                    <p className="text-neutral-500 line-clamp-1 text-[11px]">Tải về tệp Excel Matrix lớp thành công...</p>
                  </div>
                  <div className="text-xs border-l-2 border-neutral-300 pl-3 py-0.5 hover:bg-neutral-50 rounded-r transition-colors duration-200 cursor-pointer">
                    <p className="font-bold text-neutral-700">Khung chương trình Khóa 2022</p>
                    <p className="text-neutral-500 line-clamp-1 text-[11px]">Đã nhập 45 môn học vào hệ thống...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid Section */}
      <section id="features" className="px-6 py-24 bg-white border-y border-neutral-200/85 lg:px-8 scroll-mt-10 relative">
        <div className="absolute top-1/2 left-1/4 w-87.5 h-87.5 bg-violet-400/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
              Giải pháp tối ưu hóa quản lý giáo dục
            </h2>
            <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
              Chúng tôi tập trung giải quyết các bài toán phức tạp trong quản lý chương trình học tập, biến dữ liệu thô rời rạc thành báo cáo trực quan.
            </p>
          </div>

          {/* Solutions Content Grid */}
          <div className="mt-16 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreSolutions.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-violet-300 hover:bg-linear-to-b hover:from-white hover:to-violet-50/10 transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl w-fit transition-colors duration-300 group-hover:bg-violet-100/50">
                  {item.icon}
                </div>
                <h3 className="mt-6 text-base sm:text-lg font-bold text-neutral-950 group-hover:text-violet-700 transition-colors duration-300">{item.title}</h3>
                <p className="mt-3 text-xs sm:text-sm text-neutral-600 leading-relaxed flex-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="px-6 py-24 lg:px-8 max-w-6xl mx-auto w-full relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="border-r border-neutral-200/80 last:border-none p-4 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl sm:text-5xl font-extrabold bg-linear-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">100%</div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mt-3">Chuẩn hóa dữ liệu thô</div>
          </div>
          <div className="sm:border-r border-neutral-200/80 last:border-none p-4 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl sm:text-5xl font-extrabold bg-linear-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">1-Click</div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mt-3">Kết xuất ma trận tiến độ</div>
          </div>
          <div className="border-r border-neutral-200/80 last:border-none p-4 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl sm:text-5xl font-extrabold bg-linear-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">Trực quan</div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mt-3">Bản đồ điều kiện môn học</div>
          </div>
          <div className="p-4 hover:scale-105 transition-transform duration-300">
            <div className="text-4xl sm:text-5xl font-extrabold bg-linear-to-br from-violet-600 to-indigo-600 bg-clip-text text-transparent">Cảnh báo sớm</div>
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-bold mt-3">Nguy cơ trễ tốt nghiệp</div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24 bg-white border-t border-neutral-200/85 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-xs font-bold mb-4">
              <HelpCircle size={13} className="text-neutral-500" />
              <span>Hỏi & Đáp</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-950">
              Giải đáp thắc mắc thường gặp
            </h2>
            <p className="mt-3 text-neutral-600 text-sm sm:text-base">
              Các thông tin cơ bản giúp bạn nhanh chóng hiểu được tính năng cốt lõi của nền tảng Path_Minded.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm ${
                    isOpen
                      ? "border-violet-300 bg-violet-50/5"
                      : "border-neutral-200 bg-[#f6f4ef]/10 hover:border-neutral-300 hover:bg-[#f6f4ef]/20"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-neutral-950 text-sm sm:text-base transition cursor-pointer"
                  >
                    <span className={isOpen ? "text-violet-750" : ""}>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-neutral-500 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-violet-600" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? "max-h-96 border-t border-neutral-100" : "max-h-0"
                    }`}
                  >
                    <div className="p-5 text-xs sm:text-sm text-neutral-600 leading-relaxed bg-white">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="px-6 py-24 lg:px-8 text-center bg-linear-to-br from-neutral-905 via-zinc-900 to-neutral-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient(circle at bottom, rgba(139, 92, 246, 0.15) 0%, transparent 60%)" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Nâng cao chất lượng quản lý đào tạo khoa học ngay hôm nay
          </h2>
          <p className="mt-4 text-neutral-400 max-w-xl text-xs sm:text-sm leading-relaxed">
            Gia nhập Path_Minded để chuẩn hóa dữ liệu chương trình học tập, tối ưu lộ trình và quản lý hiệu quả hơn.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                href="/me"
                className="rounded-xl bg-white px-8 py-4 text-sm font-bold text-neutral-900 hover:bg-neutral-100 hover:scale-[1.03] transition-all duration-300 shadow-xl"
              >
                Vào trang cá nhân
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-4 text-sm font-bold text-neutral-900 hover:bg-neutral-100 hover:scale-[1.03] transition-all duration-300 shadow-xl"
              >
                Đăng nhập tài khoản
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
