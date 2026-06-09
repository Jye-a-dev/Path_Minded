"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Sparkles, Info, Loader2, Zap } from "lucide-react";

import { SimulatorStats } from "./components/SimulatorStats";
import { GpaProjectionTab } from "./components/GpaProjectionTab";
import { DelaySimulatorTab } from "./components/DelaySimulatorTab";
import {
  isPeCourse,
  isPeOrDefenseCourse,
  isPrepEnglishCourse,
  computeSimulatedRoadmap,
} from "./components/simulatorMath";
import { demoCurriculum, demoResults, demoPrereqs } from "./components/demoData";
import {
  StudentProfile,
  CurriculumCourse,
  CourseResult,
  PrerequisiteRule,
  GRADE_VALUES,
} from "./components/types";

export default function GraduationSimulatorPage() {
  const { user } = useAuth();

  // States
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumCourse[]>([]);
  const [results, setResults] = useState<CourseResult[]>([]);
  const [prereqs, setPrereqs] = useState<PrerequisiteRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"projection" | "delay">("projection");

  // Simulation Projection States
  const [targetGpa, setTargetGpa] = useState<number>(3.2);
  const [mockGrades, setMockGrades] = useState<Record<string, string>>({}); // course_code -> letter_grade
  const [nextSemesterGpa, setNextSemesterGpa] = useState<string>("");

  // Delay Simulation States
  const [selectedCourseToFail, setSelectedCourseToFail] = useState<string>("");
  const [retakeDelaySemesters, setRetakeDelaySemesters] = useState<number>(2); // Default to 2 semesters
  const [isDelaySimulated, setIsDelaySimulated] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentRes = await api.get(`/students?user_id=${user.id}`);
        if (studentRes.data && studentRes.data.length > 0) {
          const profileData: StudentProfile = studentRes.data[0];
          setProfile(profileData);

          if (profileData.program_id) {
            const [curriculumRes, resultsRes, prereqRes] = await Promise.all([
              api.get(`/curriculum_courses?program_id=${profileData.program_id}&limit=500`),
              api.get(`/student_course_results?student_id=${profileData.id}&limit=500`),
              api.get(`/course_prerequisites?program_id=${profileData.program_id}&limit=500`),
            ]);

            // Set curriculum
            const curriculumList: CurriculumCourse[] =
              curriculumRes.data?.data ?? curriculumRes.data ?? [];
            setCurriculum(curriculumList);

            // Set results
            const resultsList: CourseResult[] = resultsRes.data ?? [];
            setResults(resultsList);

            // Set prerequisites
            const prereqList: PrerequisiteRule[] = prereqRes.data ?? [];
            setPrereqs(prereqList);
          } else {
            setError("Tài khoản chưa được gán mã chương trình đào tạo. Vui lòng cập nhật hồ sơ.");
          }
        } else {
          setError("Không tìm thấy thông tin sinh viên cho tài khoản này.");
        }
      } catch (err) {
        console.error("Error loading simulator data:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu chương trình học.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [user]);

  // Demo Fallback Data Generator
  const loadDemoData = () => {
    setError(null);
    setProfile({
      id: "demo-student-id",
      student_code: "SV123456",
      full_name: "Nguyễn Văn Demo",
      program_id: "demo-program-id",
      cohort_year: 2023,
    });
    setCurriculum(demoCurriculum);
    setResults(demoResults);
    setPrereqs(demoPrereqs);
  };

  // Check if student has actual academic data
  const hasAcademicData = curriculum.length > 0;

  // 1. Passed courses that count towards the GPA calculation (exclude PE/Defense, Prep English, and must have score_4 !== null)
  const gpaPassedCourses = useMemo(() => {
    return results.filter(
      (r) =>
        r.status === "PASSED" &&
        r.score_4 !== null &&
        !isPeOrDefenseCourse(r.course_code, r.course_name, curriculum) &&
        !isPrepEnglishCourse(r.course_code, r.course_name) &&
        (Number(r.credits) || 0) > 0
    );
  }, [results, curriculum]);

  // 2. Passed courses that count towards the total completed credits (exclude PE/Defense, Prep English, but can have score_4 === null e.g. Exempted/MT courses)
  const creditsPassedCourses = useMemo(() => {
    return results.filter(
      (r) =>
        r.status === "PASSED" &&
        !isPeOrDefenseCourse(r.course_code, r.course_name, curriculum) &&
        !isPrepEnglishCourse(r.course_code, r.course_name) &&
        (Number(r.credits) || 0) > 0
    );
  }, [results, curriculum]);

  // Current completed credits
  const currentPassedCredits = useMemo(() => {
    return creditsPassedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [creditsPassedCourses]);

  // Current weighted GPA
  const currentCumulativeGpa = useMemo(() => {
    const totalWeightedPoints = gpaPassedCourses.reduce(
      (sum, c) => sum + Number(c.score_4 ?? 0) * (Number(c.credits) || 0),
      0
    );
    const totalGpaCredits = gpaPassedCourses.reduce(
      (sum, c) => sum + (Number(c.credits) || 0),
      0
    );
    return totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0;
  }, [gpaPassedCourses]);

  // Total curriculum credits: sum of non-PE/Defense, non-prep English credits
  const totalCurriculumCredits = useMemo(() => {
    return curriculum
      .filter(
        (c) =>
          !isPeOrDefenseCourse(c.course_code, c.course_name, curriculum) &&
          !isPrepEnglishCourse(c.course_code, c.course_name)
      )
      .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [curriculum]);

  // Remaining credits
  const remainingCredits = useMemo(() => {
    return Math.max(0, totalCurriculumCredits - currentPassedCredits);
  }, [totalCurriculumCredits, currentPassedCredits]);

  // Remaining courses list (uncompleted or failed or studying)
  // If the student already completed >= 2 PE courses, exclude all remaining PE courses.
  const remainingCourses = useMemo(() => {
    const passedPeCount = results.filter(
      (r) =>
        r.status === "PASSED" &&
        isPeCourse(r.course_code, r.course_name, curriculum)
    ).length;

    const passedCodes = new Set(results.filter((r) => r.status === "PASSED").map((r) => r.course_code));

    return curriculum.filter((c) => {
      if (passedCodes.has(c.course_code)) return false;

      // Exclude prep English courses from remaining list
      if (isPrepEnglishCourse(c.course_code, c.course_name)) return false;

      const isPE = isPeCourse(c.course_code, c.course_name, curriculum);
      if (isPE && passedPeCount >= 2) return false;

      return true;
    });
  }, [curriculum, results]);

  // Required GPA calculation on remaining credits
  const requiredGpaOnRemaining = useMemo(() => {
    if (remainingCredits <= 0) return 0;
    const currentGpaPoints = gpaPassedCourses.reduce(
      (sum, c) => sum + Number(c.score_4 ?? 0) * (Number(c.credits) || 0),
      0
    );
    const neededPoints = targetGpa * totalCurriculumCredits - currentGpaPoints;
    return Math.max(0, neededPoints / remainingCredits);
  }, [targetGpa, totalCurriculumCredits, gpaPassedCourses, remainingCredits]);

  // Feasibility status badge configuration
  const feasibilityConfig = useMemo(() => {
    if (remainingCredits <= 0) {
      return {
        text: "Hoàn thành chương trình",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        isFeasible: true,
      };
    }
    if (requiredGpaOnRemaining > 4.0) {
      return {
        text: "Không khả thi (Yêu cầu GPA > 4.0)",
        bg: "bg-red-100 text-red-700 border-red-200",
        isFeasible: false,
      };
    }
    if (requiredGpaOnRemaining > 3.6) {
      return {
        text: "Rất khó khăn (Cần điểm A xuất sắc)",
        bg: "bg-orange-100 text-orange-700 border-orange-200",
        isFeasible: true,
      };
    }
    if (requiredGpaOnRemaining > 3.2) {
      return {
        text: "Thử thách (Cần nhiều điểm B+/A)",
        bg: "bg-amber-100 text-amber-700 border-amber-200",
        isFeasible: true,
      };
    }
    return {
      text: "Khả thi (Mức điểm bình thường)",
      bg: "bg-emerald-100 text-emerald-700 border-emerald-200",
      isFeasible: true,
    };
  }, [requiredGpaOnRemaining, remainingCredits]);

  // Live Simulated GPA combining real passed grades + mock planner selections
  const simulatedGpaData = useMemo(() => {
    let totalWeightedPoints = gpaPassedCourses.reduce(
      (sum, c) => sum + Number(c.score_4 ?? 0) * (Number(c.credits) || 0),
      0
    );
    let totalGpaCredits = gpaPassedCourses.reduce(
      (sum, c) => sum + (Number(c.credits) || 0),
      0
    );
    let totalAccumulatedCredits = currentPassedCredits;

    // Add mock planner courses
    remainingCourses.forEach((c) => {
      const mockGrade = mockGrades[c.course_code];
      if (mockGrade && mockGrade !== "NONE") {
        // Exclude PE/Defense/prep English from GPA and credit accumulation
        const isPEOrDef = isPeOrDefenseCourse(c.course_code, c.course_name, curriculum);
        const isPrepEng = isPrepEnglishCourse(c.course_code, c.course_name);

        if (!isPEOrDef && !isPrepEng) {
          const score = GRADE_VALUES[mockGrade];
          if (score !== undefined) {
            totalWeightedPoints += score * (Number(c.credits) || 0);
            totalGpaCredits += Number(c.credits) || 0;
            totalAccumulatedCredits += Number(c.credits) || 0;
          }
        }
      }
    });

    return {
      gpa: totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0,
      credits: totalAccumulatedCredits,
    };
  }, [gpaPassedCourses, currentPassedCredits, remainingCourses, mockGrades, curriculum]);

  // Next semester projection math
  const nextSemesterProjection = useMemo(() => {
    const semGpa = parseFloat(nextSemesterGpa);
    if (isNaN(semGpa) || semGpa < 0 || semGpa > 4.0) return null;

    // We assume 15 credits is standard semester size
    const estSemesterCredits = 15;
    const currentGpaPoints = gpaPassedCourses.reduce(
      (sum, c) => sum + Number(c.score_4 ?? 0) * (Number(c.credits) || 0),
      0
    );
    const currentGpaCredits = gpaPassedCourses.reduce(
      (sum, c) => sum + (Number(c.credits) || 0),
      0
    );
    const totalWeightedPoints = currentGpaPoints + semGpa * estSemesterCredits;
    const totalGpaCredits = currentGpaCredits + estSemesterCredits;
    const newGpa = totalGpaCredits > 0 ? totalWeightedPoints / totalGpaCredits : 0;

    // Remaining credits after next semester
    const newPassedCredits = currentPassedCredits + estSemesterCredits;
    const remCredits = Math.max(0, totalCurriculumCredits - newPassedCredits);
    const neededPoints = targetGpa * totalCurriculumCredits - newGpa * totalGpaCredits;
    const newRequiredGpa = remCredits > 0 ? Math.max(0, neededPoints / remCredits) : 0;

    return {
      projectedGpa: newGpa,
      newRequiredGpa,
      isFeasible: newRequiredGpa <= 4.0,
    };
  }, [nextSemesterGpa, gpaPassedCourses, currentPassedCredits, targetGpa, totalCurriculumCredits]);

  // DAG delay traversal for trượt môn tiên quyết
  const simulatedRoadmap = useMemo(() => {
    return computeSimulatedRoadmap(
      curriculum,
      prereqs,
      selectedCourseToFail,
      retakeDelaySemesters,
      isDelaySimulated
    );
  }, [curriculum, prereqs, selectedCourseToFail, retakeDelaySemesters, isDelaySimulated]);

  // Dropdown list for selection of courses to simulate failure
  const failSimulatorCourseOptions = useMemo(() => {
    return curriculum
      .map((c) => {
        const res = results.find((r) => r.course_code === c.course_code);
        return {
          ...c,
          isPassed: res?.status === "PASSED",
        };
      })
      .filter((c) => !c.isPassed);
  }, [curriculum, results]);

  return (
    <div className="space-y-8 relative">
      {/* Glow backgrounds */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-violet-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-fuchsia-400/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="border-b border-zinc-200 pb-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-3">
          <Sparkles size={13} />
          <span>Công cụ học tập thông minh</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
          Giả lập & Dự phóng Tốt nghiệp
          {profile?.full_name ? ` — ${profile.full_name}` : ""}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Giả lập điểm số học kỳ để lập lộ trình tốt nghiệp bằng Khá/Giỏi, hoặc thử nghiệm các kịch bản chậm tiến độ khi trượt môn.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-[40vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            <p className="text-sm font-semibold text-neutral-500">
              Đang đồng bộ dữ liệu chương trình học...
            </p>
          </div>
        </div>
      )}

      {/* Error / Empty state */}
      {!loading && error && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 max-w-xl mx-auto text-center space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 border border-amber-100">
            <Info size={24} />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Không thể tải lộ trình</h2>
          <p className="text-sm text-neutral-500 leading-relaxed">{error}</p>
          <button
            onClick={loadDemoData}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 text-sm font-bold shadow-md transition-all"
          >
            <Zap size={16} /> Chạy thử bản Demo mẫu 
          </button>
        </div>
      )}

      {/* Main Content Dashboard */}
      {!loading && !error && hasAcademicData && (
        <div className="space-y-6">
          {/* ── Top Dashboard Stats ───────────────────────────────── */}
          <SimulatorStats
            currentCumulativeGpa={currentCumulativeGpa}
            currentPassedCredits={currentPassedCredits}
            totalCurriculumCredits={totalCurriculumCredits}
            remainingCredits={remainingCredits}
            simulatedGpa={simulatedGpaData.gpa}
            simulatedCredits={simulatedGpaData.credits}
          />

          {/* ── Tabs Selector ────────────────────────────────────── */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setActiveTab("projection")}
              className={`pb-3 text-sm font-bold border-b-2 px-6 transition-all ${
                activeTab === "projection"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Dự phóng Mục tiêu GPA tốt nghiệp
            </button>
            <button
              onClick={() => setActiveTab("delay")}
              className={`pb-3 text-sm font-bold border-b-2 px-6 transition-all ${
                activeTab === "delay"
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              Giả lập trượt môn & Chậm tiến độ (Prerequisite Delay)
            </button>
          </div>

          {/* ── TAB 1: GPA PROJECTION ─────────────────────────────── */}
          {activeTab === "projection" && (
            <GpaProjectionTab
              targetGpa={targetGpa}
              setTargetGpa={setTargetGpa}
              nextSemesterGpa={nextSemesterGpa}
              setNextSemesterGpa={setNextSemesterGpa}
              remainingCredits={remainingCredits}
              requiredGpaOnRemaining={requiredGpaOnRemaining}
              feasibilityConfig={feasibilityConfig}
              nextSemesterProjection={nextSemesterProjection}
              remainingCourses={remainingCourses}
              results={results}
              mockGrades={mockGrades}
              setMockGrades={setMockGrades}
            />
          )}

          {/* ── TAB 2: PREREQUISITE DELAY SIMULATOR ───────────────── */}
          {activeTab === "delay" && (
            <DelaySimulatorTab
              selectedCourseToFail={selectedCourseToFail}
              setSelectedCourseToFail={setSelectedCourseToFail}
              retakeDelaySemesters={retakeDelaySemesters}
              setRetakeDelaySemesters={setRetakeDelaySemesters}
              isDelaySimulated={isDelaySimulated}
              setIsDelaySimulated={setIsDelaySimulated}
              simulatedRoadmap={simulatedRoadmap}
              failSimulatorCourseOptions={failSimulatorCourseOptions}
              results={results}
            />
          )}
        </div>
      )}
    </div>
  );
}
