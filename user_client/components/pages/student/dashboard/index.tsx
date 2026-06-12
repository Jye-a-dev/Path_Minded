"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  isPeOrDefenseCourse,
  isPrepEnglishCourse,
} from "../simulator/components/simulatorMath";
import { ShieldCheck, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { DashboardStats } from "./components/DashboardStats";
import { RoadmapSection } from "./components/RoadmapSection";
import { ProfileCard } from "./components/ProfileCard";

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

interface ProgramInfo {
  id: string;
  total_credits?: number;
}

interface ActiveAlert {
  id: string;
  student_id: string;
  alert_type: "PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING";
  alert_status: "ACTIVE" | "RESOLVED";
  gpa?: number | null;
  total_credits?: number | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [accumulatedCredits, setAccumulatedCredits] = useState<number | null>(null);
  const [cumulativeGpa, setCumulativeGpa] = useState<number | null>(null);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);

  const fetchActiveAlert = useCallback(async (studentId: string) => {
    try {
      const res = await api.get(`/alerts/active?studentId=${studentId}`);
      setActiveAlert(res.data);
    } catch (err) {
      console.error("Failed to fetch active alert:", err);
    }
  }, []);

  useEffect(() => {
    if (!studentProfile?.id) return;
    
    const timer = setTimeout(() => {
      void fetchActiveAlert(studentProfile.id);
    }, 0);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const eventSourceUrl = `${apiBaseUrl}/sync/alerts/stream?studentId=${studentProfile.id}`;
    const eventSource = new EventSource(eventSourceUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("SSE update received:", payload);
        void fetchActiveAlert(studentProfile.id);
      } catch (err) {
        console.error("Failed to parse SSE event data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection error:", err);
    };

    return () => {
      clearTimeout(timer);
      eventSource.close();
    };
  }, [studentProfile?.id, fetchActiveAlert]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoadingStudent(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) {
          const profile: StudentProfile = res.data[0];
          setStudentProfile(profile);

          // Fetch program info for total_credits
          if (profile.program_id) {
            try {
              const progRes = await api.get(`/programs/${profile.program_id}`);
              setProgramInfo(progRes.data);
            } catch {
              // program not found, ignore
            }
          }

          // Fetch accumulated credits and GPA from passed courses
          if (profile.id) {
            try {
              const credRes = await api.get(
                `/student_course_results?student_id=${profile.id}&status=PASSED&limit=500`
              );
              interface ResultRow {
                course_code: string;
                course_name?: string;
                credits?: number;
                score_4?: number | null;
              }
              const rows: ResultRow[] = credRes.data ?? [];
              
              // Apply the same exclusion and calculation rules as the simulator
              const gpaCourses = rows.filter(
                (r) =>
                  r.score_4 !== null &&
                  r.score_4 !== undefined &&
                  !isPeOrDefenseCourse(r.course_code, r.course_name || "", []) &&
                  !isPrepEnglishCourse(r.course_code, r.course_name || "") &&
                  (Number(r.credits) || 0) > 0
              );

              const creditCourses = rows.filter(
                (r) =>
                  !isPeOrDefenseCourse(r.course_code, r.course_name || "", []) &&
                  !isPrepEnglishCourse(r.course_code, r.course_name || "") &&
                  (Number(r.credits) || 0) > 0
              );

              const totalCredits = creditCourses.reduce(
                (sum, r) => sum + (Number(r.credits) || 0),
                0
              );

              const totalWeightedPoints = gpaCourses.reduce(
                (sum, r) => sum + Number(r.score_4 ?? 0) * (Number(r.credits) || 0),
                0
              );
              const totalGpaCredits = gpaCourses.reduce(
                (sum, r) => sum + (Number(r.credits) || 0),
                0
              );

              const gpa = totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0;

              setAccumulatedCredits(totalCredits);
              setCumulativeGpa(gpa);
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoadingStudent(false);
      }
    };
    void fetch();
  }, [user]);

  const totalCredits = programInfo?.total_credits ?? null;
  const creditDisplay = studentProfile?.has_grades
    ? accumulatedCredits !== null
      ? totalCredits !== null
        ? `${accumulatedCredits} / ${totalCredits}`
        : `${accumulatedCredits}`
      : "—"
    : "—";
  const creditPercent =
    accumulatedCredits !== null && totalCredits !== null && totalCredits > 0
      ? Math.round((accumulatedCredits / totalCredits) * 100)
      : null;
  const creditDesc = studentProfile?.has_grades
    ? creditPercent !== null
      ? `Đã hoàn thành ${creditPercent}%`
      : "Đang tính toán..."
    : "Chưa cập nhật bảng điểm";


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
          trong hệ thống. Vui lòng liên hệ Cố văn Học tập để được hỗ trợ.
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

      {/* Warning Banner */}
      {activeAlert && (
        <div
          className={`relative z-10 border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-md ${
            activeAlert.alert_type === "PROBATION_RISK"
              ? "bg-red-50/90 border-red-200 text-red-900 shadow-red-100/30"
              : "bg-amber-50/90 border-amber-200 text-amber-950 shadow-amber-100/30"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                activeAlert.alert_type === "PROBATION_RISK"
                  ? "bg-red-100 border-red-200 text-red-650"
                  : "bg-amber-100 border-amber-200 text-amber-650"
              }`}
            >
              <AlertCircle size={22} className={activeAlert.alert_type === "PROBATION_RISK" ? "animate-pulse" : ""} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold tracking-tight">
                {activeAlert.alert_type === "PROBATION_RISK"
                  ? "CẢNH BÁO: RỦI RO BỊ BUỘC THÔI HỌC / ĐÌNH CHỈ"
                  : activeAlert.alert_type === "GPA_WARNING"
                  ? "CẢNH BÁO HỌC VỤ: GPA DƯỚI MỨC AN TOÀN"
                  : "CẢNH BÁO HỌC PHẦN TIÊN QUYẾT / CHẬM TIẾN ĐỘ"}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed font-semibold">
                {activeAlert.description}
              </p>
              {activeAlert.gpa !== null && activeAlert.gpa !== undefined && (
                <div className="flex items-center gap-3.5 text-[10px] font-bold mt-1.5 opacity-80">
                  <span>GPA hiện tại: <span className="underline">{Number(activeAlert.gpa).toFixed(2)}</span></span>
                  {activeAlert.total_credits && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-350" />
                      <span>Số tín chỉ bị ảnh hưởng: {activeAlert.total_credits}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <Link
              href="/student/simulator"
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                activeAlert.alert_type === "PROBATION_RISK"
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                  : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200"
              }`}
            >
              <span>Xem giải pháp & Giả lập</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <DashboardStats
        creditDisplay={creditDisplay}
        creditDesc={creditDesc}
        cumulativeGpa={cumulativeGpa}
        cohortYear={studentProfile.cohort_year}
        hasGrades={studentProfile.has_grades}
      />

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Left: Recommended roadmap */}
        <div className="lg:col-span-2">
          <RoadmapSection hasGrades={studentProfile.has_grades} />
        </div>

        {/* Right: Profile card */}
        <div>
          <ProfileCard
            fullName={studentProfile.full_name}
            studentCode={studentProfile.student_code}
            email={user?.email ?? ""}
            status={studentProfile.status}
          />
        </div>
      </div>
    </div>
  );
}
