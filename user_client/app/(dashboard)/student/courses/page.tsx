"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";

interface CourseResult {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  score10?: number | null;
  score4?: number | null;
  letter_grade?: string | null;
  status: "PASSED" | "FAILED" | "IN_PROGRESS";
  school_year?: string;
  semester_number?: number;
}

interface StudentProfile {
  id: string;
  full_name: string;
  has_grades?: boolean;
}

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const studentRes = await api.get(`/students?user_id=${user.id}`);
        if (studentRes.data?.length > 0) {
          const profile = studentRes.data[0];
          setStudentProfile(profile);
          // Fetch course results
          const coursesRes = await api.get(
            `/student_course_results?student_id=${profile.id}&limit=200`
          );
          setCourses(coursesRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, [user]);

  const filtered = courses.filter(
    (c) =>
      c.course_code?.toLowerCase().includes(search.toLowerCase()) ||
      c.course_name?.toLowerCase().includes(search.toLowerCase())
  );

  const passed = courses.filter((c) => c.status === "PASSED").length;
  const failed = courses.filter((c) => c.status === "FAILED").length;
  const totalCredits = courses
    .filter((c) => c.status === "PASSED")
    .reduce((sum, c) => sum + (c.credits || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải danh sách môn học...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
          <BookOpen size={12} />
          <span>Môn học đã hoàn thành</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Kết quả Học tập
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Toàn bộ các học phần đã bóc tách từ bảng điểm tích lũy của bạn.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Đã đạt",
            value: passed,
            icon: <CheckCircle2 size={18} className="text-emerald-600" />,
            color: "bg-emerald-50 border-emerald-100 text-emerald-700",
          },
          {
            label: "Không đạt",
            value: failed,
            icon: <XCircle size={18} className="text-red-500" />,
            color: "bg-red-50 border-red-100 text-red-700",
          },
          {
            label: "Tín chỉ tích lũy",
            value: totalCredits,
            icon: <BookOpen size={18} className="text-violet-600" />,
            color: "bg-violet-50 border-violet-100 text-violet-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${s.color} bg-opacity-60`}
          >
            {s.icon}
            <div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-400">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">
            Chưa có dữ liệu môn học
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Vui lòng nhập bảng điểm tại mục{" "}
            <strong>Bảng điểm & Transcript</strong> để hệ thống bóc tách kết
            quả học tập.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Search */}
          <div className="p-4 border-b border-zinc-100">
            <div className="relative max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Tìm theo mã môn hoặc tên môn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Học kỳ</th>
                  <th className="px-5 py-3.5">Mã môn</th>
                  <th className="px-5 py-3.5">Tên môn học</th>
                  <th className="px-5 py-3.5 text-center">TC</th>
                  <th className="px-5 py-3.5 text-center">Hệ 10</th>
                  <th className="px-5 py-3.5 text-center">Hệ 4</th>
                  <th className="px-5 py-3.5 text-center">Chữ</th>
                  <th className="px-5 py-3.5">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-violet-50/20 text-neutral-700 transition-colors"
                  >
                    <td className="px-5 py-3 text-neutral-400 text-xs">
                      {c.school_year
                        ? `${c.school_year} HK${c.semester_number}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-violet-600">
                      {c.course_code}
                    </td>
                    <td className="px-5 py-3 font-medium text-neutral-800">
                      {c.course_name}
                    </td>
                    <td className="px-5 py-3 text-center text-neutral-500">
                      {c.credits}
                    </td>
                    <td className="px-5 py-3 text-center font-mono">
                      {c.score10 ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-center font-mono">
                      {c.score4 ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-center font-mono font-bold">
                      {c.letter_grade || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          c.status === "PASSED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : c.status === "FAILED"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {c.status === "PASSED" ? (
                          <><CheckCircle2 size={10} /> Đạt</>
                        ) : c.status === "FAILED" ? (
                          <><XCircle size={10} /> Rớt</>
                        ) : (
                          <><Clock size={10} /> Đang học</>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-neutral-400 text-xs">
                Không tìm thấy môn học phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
