import React from "react";
import Link from "next/link";
import { User as UserIcon, CheckCircle2, ArrowRight } from "lucide-react";

interface ProfileCardProps {
  fullName: string;
  studentCode: string;
  email: string;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
}

export function ProfileCard({
  fullName,
  studentCode,
  email,
  status,
}: ProfileCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sticky top-6">
      <h3 className="text-sm font-bold text-neutral-950 mb-5 flex items-center gap-2">
        <UserIcon size={16} className="text-violet-600" />
        Hồ sơ sinh viên
      </h3>

      <div className="space-y-4">
        {[
          { label: "Họ và tên", value: fullName },
          {
            label: "Mã số sinh viên",
            value: studentCode,
            mono: true,
          },
          { label: "Email liên kết", value: email },
        ].map((field) => (
          <div key={field.label}>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {field.label}
            </span>
            <p
              className={`text-sm font-semibold text-neutral-900 mt-0.5 ${
                field.mono ? "font-mono" : ""
              }`}
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
                status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : status === "GRADUATED"
                  ? "bg-blue-50 text-blue-700 border-blue-100"
                  : "bg-red-50 text-red-700 border-red-100"
              }`}
            >
              <CheckCircle2 size={11} />
              {status === "ACTIVE"
                ? "Đang học"
                : status === "GRADUATED"
                ? "Đã tốt nghiệp"
                : "Đã thôi học"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-zinc-100">
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Phát hiện sai lệch thông tin? Liên hệ CVHT của lớp để kiểm tra và chỉnh
          sửa.
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
  );
}
