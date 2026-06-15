"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  MessageCircle,
  Clock,
  Info,
  Loader2,
  Calendar,
  User,
  FileText,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface StudentProfile {
  id: string;
  advisor_feedback?: string | null;
}

interface AdvisingLog {
  id: string;
  student_id: string;
  advisor_id: string | null;
  alert_id: string | null;
  log_date: string;
  content: string;
  advisor_name: string | null;
  alert_type: string | null;
  alert_description: string | null;
}

export default function StudentAdvisorPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [logs, setLogs] = useState<AdvisingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfileAndLogs = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) {
          const studentProfile = res.data[0];
          setProfile(studentProfile);

          // Fetch logs
          setLoadingLogs(true);
          try {
            const logsRes = await api.get(`/alerts/advising-logs?studentId=${studentProfile.id}`);
            setLogs(logsRes.data || []);
          } catch (err) {
            console.error("Failed to load advising logs:", err);
          } finally {
            setLoadingLogs(false);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProfileAndLogs();
  }, [user]);

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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-xs font-bold text-zinc-400">Đang tải thông tin tư vấn...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-400">
          <AlertCircle size={26} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">
          Chưa liên kết hồ sơ
        </h1>
        <p className="text-sm text-neutral-500">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ sinh viên để xem thông tin Cố vấn Học tập.
        </p>
      </div>
    );
  }

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

      {/* Advisor Feedback Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900">Nhận xét từ Cố vấn học tập</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Lời khuyên &amp; Phản hồi chính thức</p>
          </div>
        </div>
        
        {profile?.advisor_feedback ? (
          <div className="bg-violet-50/20 rounded-2xl border border-violet-100/30 p-5">
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap font-medium">
              {profile.advisor_feedback}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-neutral-50/50 p-6 text-center">
            <p className="text-xs text-neutral-450 font-bold leading-relaxed">
              Hiện tại chưa có ý kiến phản hồi hoặc nhận xét nào từ Cố vấn học tập dành cho bạn.
            </p>
          </div>
        )}
      </div>

      {/* Advising Logs Section */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 border-b border-zinc-150 pb-4 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900">Nhật ký tư vấn học tập</h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Lịch sử ghi chép &amp; Trao đổi chi tiết</p>
          </div>
        </div>

        {loadingLogs ? (
          <div className="flex py-8 items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
            <span className="text-xs font-bold">Đang tải nhật ký tư vấn...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-zinc-150 rounded-2xl p-4 bg-zinc-50/20 hover:shadow-xs transition-shadow relative"
              >
                <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-bold text-neutral-450">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-neutral-400" />
                    <span>{new Date(log.log_date).toLocaleString("vi-VN")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-neutral-400" />
                    <span>Cố vấn: {log.advisor_name || "Hệ thống"}</span>
                  </div>
                  {log.alert_type && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1">
                      <AlertTriangle size={9} />
                      Liên kết cảnh báo
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-700 mt-2.5 whitespace-pre-wrap leading-relaxed font-medium">
                  {log.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-neutral-50/50 p-6 text-center">
            <p className="text-xs text-neutral-450 font-bold leading-relaxed">
              Hiện tại chưa có nhật ký tư vấn nào được ghi nhận từ Cố vấn học tập.
            </p>
          </div>
        )}
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
