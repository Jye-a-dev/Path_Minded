"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  isPeOrDefenseCourse,
  isPrepEnglishCourse,
} from "../simulator/components/simulatorMath";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
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

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [accumulatedCredits, setAccumulatedCredits] = useState<number | null>(null);
  const [cumulativeGpa, setCumulativeGpa] = useState<number | null>(null);

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
