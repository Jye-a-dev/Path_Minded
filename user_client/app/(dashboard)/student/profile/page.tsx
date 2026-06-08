"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  GraduationCap,
  Mail,
  Hash,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User as UserIcon,
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

interface ClassDetail {
  id: string;
  class_code: string;
  class_name: string;
}

interface ProgramDetail {
  id: string;
  program_code: string;
  program_name: string;
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null);
  const [programDetail, setProgramDetail] = useState<ProgramDetail | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) {
          const studentProfile = res.data[0];
          setProfile(studentProfile);

          // Fetch class and program details
          const fetchClass = async () => {
            if (studentProfile.class_id) {
              try {
                const classRes = await api.get<ClassDetail>(`/classes/${studentProfile.class_id}`);
                setClassDetail(classRes.data);
              } catch (err) {
                console.error("Failed to fetch class info:", err);
              }
            }
          };

          const fetchProgram = async () => {
            if (studentProfile.program_id) {
              try {
                const programRes = await api.get<ProgramDetail>(`/programs/${studentProfile.program_id}`);
                setProgramDetail(programRes.data);
              } catch (err) {
                console.error("Failed to fetch program info:", err);
              }
            }
          };

          await Promise.all([fetchClass(), fetchProgram()]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
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
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ sinh viên.
        </p>
      </div>
    );
  }

  const statusLabel =
    profile.status === "ACTIVE"
      ? "Đang học"
      : profile.status === "GRADUATED"
        ? "Đã tốt nghiệp"
        : "Đã thôi học";

  const statusColor =
    profile.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : profile.status === "GRADUATED"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-red-50 text-red-700 border-red-200";

  const fields = [
    {
      label: "Họ và tên",
      value: profile.full_name,
      icon: <UserIcon size={16} className="text-violet-500" />,
    },
    {
      label: "Mã số sinh viên (MSSV)",
      value: profile.student_code,
      icon: <Hash size={16} className="text-violet-500" />,
      mono: true,
    },
    {
      label: "Email tài khoản",
      value: user?.email ?? "—",
      icon: <Mail size={16} className="text-violet-500" />,
    },
    {
      label: "Tên lớp học",
      value: classDetail?.class_name ?? (profile.class_id ? "Đang tải..." : "Chưa xác định"),
      icon: <Building2 size={16} className="text-violet-500" />,
    },
    {
      label: "Mã lớp",
      value: classDetail?.class_code ?? (profile.class_id ? "Đang tải..." : "Chưa xác định"),
      icon: <Building2 size={16} className="text-violet-500" />,
      mono: true,
    },
    {
      label: "Tên chương trình đào tạo",
      value: programDetail?.program_name ?? (profile.program_id ? "Đang tải..." : "Chưa xác định"),
      icon: <GraduationCap size={16} className="text-violet-500" />,
    },
    {
      label: "Mã chương trình đào tạo",
      value: programDetail?.program_code ?? (profile.program_id ? "Đang tải..." : "Chưa xác định"),
      icon: <GraduationCap size={16} className="text-violet-500" />,
      mono: true,
    },
    {
      label: "Niên khóa",
      value: profile.cohort_year ? `${profile.cohort_year}` : "Chưa xác định",
      icon: <Calendar size={16} className="text-violet-500" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
          <GraduationCap size={12} />
          <span>Hồ sơ sinh viên</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Thông tin cá nhân
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Thông tin hồ sơ học tập được lưu trong hệ thống PathMinded.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Avatar banner */}
        <div className="bg-linear-to-br from-violet-600 to-indigo-600 px-6 py-8 flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
            <GraduationCap size={32} />
          </div>
          <div>
            <p className="text-white font-extrabold text-xl">{profile.full_name}</p>
            <p className="text-violet-200 text-sm font-mono mt-0.5">
              {profile.student_code}
            </p>
            <span
              className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${statusColor}`}
            >
              <CheckCircle2 size={10} />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-zinc-100">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-4 px-6 py-4"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100 shrink-0">
                {f.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {f.label}
                </p>
                <p
                  className={`text-sm font-semibold text-neutral-900 mt-0.5 truncate ${f.mono ? "font-mono" : ""}`}
                >
                  {f.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 text-xs text-amber-700 leading-relaxed">
        <strong>Lưu ý:</strong> Nếu phát hiện thông tin sai lệch (họ tên, MSSV,
        lớp học...) vui lòng liên hệ Cố vấn Học tập của lớp để được hỗ trợ
        chỉnh sửa trong hệ thống.
      </div>
    </div>
  );
}
