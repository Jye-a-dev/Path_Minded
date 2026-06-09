"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import {
  MessageCircle,
  Mail,
  Phone,
  Clock,
  Info,
  ExternalLink,
} from "lucide-react";

export default function StudentAdvisorPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    advisor_email: "cvht@vlu.edu.vn",
    training_hotline: "(028) 7109 9221",
    asc_portal_url: "https://asc.vlu.edu.vn",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data) {
          setSettings((prev) => ({
            ...prev,
            ...res.data,
          }));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    void fetchSettings();
  }, []);

  const channels = [
    {
      icon: <Mail className="h-5 w-5 text-violet-600" />,
      title: "Email Phòng CNTT",
      desc: "Gửi yêu cầu hỗ trợ qua email nội bộ của trường",
      action: settings.advisor_email,
      href: `mailto:${settings.advisor_email}`,
      color: "hover:border-violet-300 hover:bg-violet-50/30",
      iconBg: "bg-violet-50 border-violet-100",
    },
    {
      icon: <Phone className="h-5 w-5 text-emerald-600" />,
      title: "Hotline phòng CNTT",
      desc: "Hỗ trợ trực tiếp qua điện thoại trong giờ hành chính",
      action: settings.training_hotline,
      href: `tel:${settings.training_hotline.replace(/[\s\(\)]+/g, "")}`,
      color: "hover:border-emerald-300 hover:bg-emerald-50/30",
      iconBg: "bg-emerald-50 border-emerald-100",
    },
    {
      icon: <ExternalLink className="h-5 w-5 text-indigo-600" />,
      title: "Cổng đào tạo online",
      desc: "Tra cứu và đăng ký học phần tại cổng chính thức",
      action: "Truy cập Online VLU Portal",
      href: settings.asc_portal_url,
      color: "hover:border-indigo-300 hover:bg-indigo-50/30",
      iconBg: "bg-indigo-50 border-indigo-100",
    },
  ];

  const faqs = [
    {
      q: "Bảng điểm tôi nhập vào có được chia sẻ với CVHT không?",
      a: "Chỉ CVHT được phân quyền cho lớp của bạn mới có thể xem báo cáo ma trận tích lũy. Dữ liệu bảng điểm thô không được chia sẻ ra ngoài.",
    },
    {
      q: "Khi nào lộ trình học tập khuyến nghị được cập nhật?",
      a: "Lộ trình được tái tính toán sau mỗi lần bạn nạp hoặc cập nhật bảng điểm thành công.",
    },
    {
      q: "Làm thế nào để sửa thông tin hồ sơ (tên, MSSV, lớp)?",
      a: "Thông tin hồ sơ do quản trị viên và CVHT quản lý. Liên hệ CVHT của lớp để yêu cầu chỉnh sửa.",
    },
    {
      q: "Dữ liệu bảng điểm của tôi có được mã hóa không?",
      a: "Toàn bộ dữ liệu được truyền qua HTTPS và lưu trữ mã hóa tại server. PathMinded không bao giờ chia sẻ dữ liệu với bên thứ ba.",
    },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-700 text-xs font-bold mb-2">
          <MessageCircle size={12} />
          <span>Hỗ trợ & Liên hệ</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Liên hệ Cố vấn Học tập
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Các kênh hỗ trợ chính thức cho sinh viên Đại học Văn Lang.
        </p>
      </div>

      {/* Working hours notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-700">
        <Clock size={18} className="shrink-0 mt-0.5 text-blue-500" />
        <div>
          <strong>Giờ hỗ trợ:</strong> Thứ 2 – Thứ 6, 08:00 – 17:00 (trừ ngày lễ, tết).
          Ngoài giờ hành chính vui lòng gửi email, CVHT sẽ phản hồi trong vòng 1 ngày làm việc.
        </div>
      </div>

      {/* Contact channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {channels.map((ch) => (
          <a
            key={ch.title}
            href={ch.href}
            target={ch.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className={`group flex flex-col gap-4 p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 ${ch.color} hover:shadow-md cursor-pointer`}
          >
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${ch.iconBg}`}
            >
              {ch.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">{ch.title}</p>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {ch.desc}
              </p>
              <p className="text-xs font-semibold text-violet-600 mt-2 break-all">
                {ch.action}
              </p>
            </div>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Info size={17} className="text-violet-500" />
          Câu hỏi thường gặp
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-sm text-neutral-900 list-none select-none">
                {faq.q}
                <span className="text-neutral-400 group-open:rotate-180 transition-transform duration-200 text-lg leading-none ml-4 shrink-0">
                  ‹
                </span>
              </summary>
              <div className="px-5 pb-5 text-xs text-neutral-500 leading-relaxed border-t border-zinc-100 pt-3">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
