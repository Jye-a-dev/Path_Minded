"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  Sparkles,
  Award,
  AlertTriangle,
  Info,
  Calendar,
  Sliders,
  Play,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
} from "lucide-react";

// Academic Classifications
const CLASSIFICATIONS = [
  { label: "Xuất sắc", minGpa: 3.60, color: "text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/70" },
  { label: "Giỏi", minGpa: 3.20, color: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70" },
  { label: "Khá", minGpa: 2.50, color: "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/70" },
  { label: "Trung bình", minGpa: 2.00, color: "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/70" },
];

const GRADE_VALUES: Record<string, number> = {
  "A+": 4.0,
  "A": 4.0,
  "B+": 3.5,
  "B": 3.0,
  "C+": 2.5,
  "C": 2.0,
  "D+": 1.5,
  "D": 1.0,
  "F": 0.0,
};

interface StudentProfile {
  id: string;
  student_code: string;
  full_name: string;
  program_id?: string;
  cohort_year?: number;
}

interface CurriculumCourse {
  course_code: string;
  course_name: string;
  credits: number;
  expected_semester: number;
  knowledge_block: string;
  is_required: boolean;
}

interface CourseResult {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  score_4: number | null;
  status: "PASSED" | "FAILED" | "STUDYING" | "NOT_STARTED";
  expected_semester?: number;
}

interface PrerequisiteRule {
  course_code: string;
  prerequisite_course_code: string;
}

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
  const [targetGpa, setTargetGpa] = useState<number>(3.20);
  const [mockGrades, setMockGrades] = useState<Record<string, string>>({}); // course_code -> letter_grade
  const [nextSemesterGpa, setNextSemesterGpa] = useState<string>("");

  // Delay Simulation States
  const [selectedCourseToFail, setSelectedCourseToFail] = useState<string>("");
  const [retakeDelaySemesters, setRetakeDelaySemesters] = useState<number>(2); // Default to 2 semesters (1 academic year)
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

    const demoCurriculum: CurriculumCourse[] = [
      { course_code: "MATH101", course_name: "Giải tích 1", credits: 3, expected_semester: 1, knowledge_block: "GENERAL", is_required: true },
      { course_code: "PHYS101", course_name: "Vật lý đại cương 1", credits: 3, expected_semester: 1, knowledge_block: "GENERAL", is_required: true },
      { course_code: "PROG101", course_name: "Nhập môn Lập trình", credits: 4, expected_semester: 1, knowledge_block: "SECTOR_CORE", is_required: true },
      
      { course_code: "MATH102", course_name: "Giải tích 2", credits: 3, expected_semester: 2, knowledge_block: "GENERAL", is_required: true },
      { course_code: "PROG102", course_name: "Kỹ thuật Lập trình", credits: 4, expected_semester: 2, knowledge_block: "SECTOR_CORE", is_required: true },
      
      { course_code: "DSA201", course_name: "Cấu trúc dữ liệu và Giải thuật", credits: 4, expected_semester: 3, knowledge_block: "MAJOR_CORE", is_required: true },
      { course_code: "DB201", course_name: "Cơ sở dữ liệu", credits: 3, expected_semester: 3, knowledge_block: "MAJOR_CORE", is_required: true },
      
      { course_code: "OOP202", course_name: "Lập trình hướng đối tượng", credits: 4, expected_semester: 4, knowledge_block: "MAJOR_CORE", is_required: true },
      { course_code: "DB202", course_name: "Hệ quản trị Cơ sở dữ liệu", credits: 3, expected_semester: 4, knowledge_block: "MAJOR_CORE", is_required: true },
      
      { course_code: "OS301", course_name: "Hệ điều hành", credits: 3, expected_semester: 5, knowledge_block: "MAJOR_CORE", is_required: true },
      { course_code: "CNPM302", course_name: "Công nghệ phần mềm", credits: 4, expected_semester: 5, knowledge_block: "MAJOR_CORE", is_required: true },
      { course_code: "WEB303", course_name: "Lập trình Web nâng cao", credits: 3, expected_semester: 5, knowledge_block: "SPECIALIZED", is_required: false },
      
      { course_code: "MOBILE304", course_name: "Lập trình thiết bị di động", credits: 3, expected_semester: 6, knowledge_block: "SPECIALIZED", is_required: false },
      { course_code: "CLOUD305", course_name: "Điện toán đám mây", credits: 3, expected_semester: 6, knowledge_block: "SPECIALIZED", is_required: true },
      
      { course_code: "INTERN401", course_name: "Thực tập tốt nghiệp", credits: 4, expected_semester: 7, knowledge_block: "SPECIALIZED", is_required: true },
      { course_code: "PROJECT402", course_name: "Đồ án chuyên ngành", credits: 4, expected_semester: 7, knowledge_block: "SPECIALIZED", is_required: true },
      
      { course_code: "THESIS403", course_name: "Khóa luận tốt nghiệp", credits: 10, expected_semester: 8, knowledge_block: "SPECIALIZED", is_required: true },
    ];
    setCurriculum(demoCurriculum);

    const demoResults: CourseResult[] = [
      { id: "1", course_code: "MATH101", course_name: "Giải tích 1", credits: 3, score_4: 3.5, status: "PASSED" },
      { id: "2", course_code: "PHYS101", course_name: "Vật lý đại cương 1", credits: 3, score_4: 2.0, status: "PASSED" },
      { id: "3", course_code: "PROG101", course_name: "Nhập môn Lập trình", credits: 4, score_4: 3.0, status: "PASSED" },
      { id: "4", course_code: "MATH102", course_name: "Giải tích 2", credits: 3, score_4: 2.5, status: "PASSED" },
      { id: "5", course_code: "PROG102", course_name: "Kỹ thuật Lập trình", credits: 4, score_4: 3.5, status: "PASSED" },
      { id: "6", course_code: "DSA201", course_name: "Cấu trúc dữ liệu và Giải thuật", credits: 4, score_4: null, status: "STUDYING" },
      { id: "7", course_code: "DB201", course_name: "Cơ sở dữ liệu", credits: 3, score_4: null, status: "STUDYING" },
    ];
    setResults(demoResults);

    const demoPrereqs: PrerequisiteRule[] = [
      { course_code: "PROG102", prerequisite_course_code: "PROG101" },
      { course_code: "DSA201", prerequisite_course_code: "PROG102" },
      { course_code: "OOP202", prerequisite_course_code: "PROG102" },
      { course_code: "DB202", prerequisite_course_code: "DB201" },
      { course_code: "CNPM302", prerequisite_course_code: "DSA201" },
      { course_code: "PROJECT402", prerequisite_course_code: "CNPM302" },
      { course_code: "THESIS403", prerequisite_course_code: "PROJECT402" },
    ];
    setPrereqs(demoPrereqs);
  };

  // Check if student has actual academic data
  const hasAcademicData = curriculum.length > 0;

  // ── MATHEMATICS FOR TARGET GPA & PROJECTION ────────────────────────
  
  // Real passed courses list
  const realPassedCourses = useMemo(() => {
    return results.filter(r => r.status === "PASSED" && r.score_4 !== null);
  }, [results]);

  // Current completed credits
  const currentPassedCredits = useMemo(() => {
    return realPassedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [realPassedCourses]);

  // Current weighted GPA
  const currentCumulativeGpa = useMemo(() => {
    const totalWeightedPoints = realPassedCourses.reduce(
      (sum, c) => sum + (Number(c.score_4 ?? 0) * (Number(c.credits) || 0)), 
      0
    );
    return currentPassedCredits > 0 ? totalWeightedPoints / currentPassedCredits : 0;
  }, [realPassedCourses, currentPassedCredits]);

  // Total curriculum credits
  const totalCurriculumCredits = useMemo(() => {
    return curriculum.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  }, [curriculum]);

  // Remaining credits
  const remainingCredits = useMemo(() => {
    return Math.max(0, totalCurriculumCredits - currentPassedCredits);
  }, [totalCurriculumCredits, currentPassedCredits]);

  // Remaining courses list (uncompleted or failed or studying)
  const remainingCourses = useMemo(() => {
    const passedCodes = new Set(realPassedCourses.map(c => c.course_code));
    return curriculum.filter(c => !passedCodes.has(c.course_code));
  }, [curriculum, realPassedCourses]);

  // Required GPA calculation on remaining credits
  const requiredGpaOnRemaining = useMemo(() => {
    if (remainingCredits <= 0) return 0;
    const neededPoints = (targetGpa * totalCurriculumCredits) - (currentCumulativeGpa * currentPassedCredits);
    return Math.max(0, neededPoints / remainingCredits);
  }, [targetGpa, totalCurriculumCredits, currentCumulativeGpa, currentPassedCredits, remainingCredits]);

  // Feasibility status badge configuration
  const feasibilityConfig = useMemo(() => {
    if (remainingCredits <= 0) {
      return { text: "Hoàn thành chương trình", bg: "bg-emerald-100 text-emerald-800 border-emerald-200", isFeasible: true };
    }
    if (requiredGpaOnRemaining > 4.0) {
      return { text: "Không khả thi (Yêu cầu GPA > 4.0)", bg: "bg-red-100 text-red-700 border-red-200", isFeasible: false };
    }
    if (requiredGpaOnRemaining > 3.6) {
      return { text: "Rất khó khăn (Cần điểm A xuất sắc)", bg: "bg-orange-100 text-orange-700 border-orange-200", isFeasible: true };
    }
    if (requiredGpaOnRemaining > 3.2) {
      return { text: "Thử thách (Cần nhiều điểm B+/A)", bg: "bg-amber-100 text-amber-700 border-amber-200", isFeasible: true };
    }
    return { text: "Khả thi (Mức điểm bình thường)", bg: "bg-emerald-100 text-emerald-700 border-emerald-200", isFeasible: true };
  }, [requiredGpaOnRemaining, remainingCredits]);

  // Live Simulated GPA combining real passed grades + mock planner selections
  const simulatedGpaData = useMemo(() => {
    let totalWeightedPoints = realPassedCourses.reduce(
      (sum, c) => sum + (Number(c.score_4 ?? 0) * (Number(c.credits) || 0)), 
      0
    );
    let totalCredits = currentPassedCredits;

    // Add mock planner courses
    remainingCourses.forEach(c => {
      const mockGrade = mockGrades[c.course_code];
      if (mockGrade && mockGrade !== "NONE") {
        const score = GRADE_VALUES[mockGrade];
        if (score !== undefined) {
          totalWeightedPoints += score * c.credits;
          totalCredits += c.credits;
        }
      }
    });

    return {
      gpa: totalCredits > 0 ? totalWeightedPoints / totalCredits : 0,
      credits: totalCredits,
    };
  }, [realPassedCourses, currentPassedCredits, remainingCourses, mockGrades]);

  // Next semester projection math
  const nextSemesterProjection = useMemo(() => {
    const semGpa = parseFloat(nextSemesterGpa);
    if (isNaN(semGpa) || semGpa < 0 || semGpa > 4.0) return null;
    
    // We assume 15 credits is standard semester size
    const estSemesterCredits = 15; 
    const totalWeightedPoints = (currentCumulativeGpa * currentPassedCredits) + (semGpa * estSemesterCredits);
    const totalCredits = currentPassedCredits + estSemesterCredits;
    const newGpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;
    
    // Remaining credits after next semester
    const remCredits = Math.max(0, totalCurriculumCredits - totalCredits);
    const neededPoints = (targetGpa * totalCurriculumCredits) - (newGpa * totalCredits);
    const newRequiredGpa = remCredits > 0 ? Math.max(0, neededPoints / remCredits) : 0;

    return {
      projectedGpa: newGpa,
      newRequiredGpa,
      isFeasible: newRequiredGpa <= 4.0,
    };
  }, [nextSemesterGpa, currentCumulativeGpa, currentPassedCredits, targetGpa, totalCurriculumCredits]);


  // ── PREREQUISITE FAIL & ROADMAP DELAY TRAVERSAL (DAG RELAXATION) ──────
  
  const simulatedRoadmap = useMemo(() => {
    if (!hasAcademicData) return null;

    // 1. Build original expected semesters for all courses
    const originalSemesters: Record<string, number> = {};
    const courseMap: Record<string, CurriculumCourse> = {};
    
    curriculum.forEach(c => {
      originalSemesters[c.course_code] = c.expected_semester;
      courseMap[c.course_code] = c;
    });

    // 2. Build graph maps
    const childrenOf: Record<string, string[]> = {};
    const parentsOf: Record<string, string[]> = {};
    
    curriculum.forEach(c => {
      childrenOf[c.course_code] = [];
      parentsOf[c.course_code] = [];
    });

    prereqs.forEach(r => {
      // Avoid circular or undefined references
      if (childrenOf[r.prerequisite_course_code] && childrenOf[r.course_code]) {
        childrenOf[r.prerequisite_course_code].push(r.course_code);
        parentsOf[r.course_code].push(r.prerequisite_course_code);
      }
    });

    // 3. Setup scheduled semesters map initialized to original semesters
    const scheduledSemesters = { ...originalSemesters };
    const affectedCourses = new Set<string>();

    if (isDelaySimulated && selectedCourseToFail) {
      // Mark failed course
      affectedCourses.add(selectedCourseToFail);
      
      // Delay the failed course's completion by retakeDelaySemesters (1 or 2 semesters)
      const baseSem = originalSemesters[selectedCourseToFail] ?? 1;
      scheduledSemesters[selectedCourseToFail] = baseSem + retakeDelaySemesters;

      // Relax semesters of descendants using a BFS/relaxation queue
      const queue = [selectedCourseToFail];
      const inQueue = new Set([selectedCourseToFail]);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        inQueue.delete(curr);

        const currSem = scheduledSemesters[curr];
        const children = childrenOf[curr] ?? [];

        children.forEach(child => {
          // Child course can only be taken in a semester AFTER all of its prerequisites are completed.
          // Minimum starting semester for child is completion semester of parent + 1.
          const minChildSem = currSem + 1;
          if (minChildSem > scheduledSemesters[child]) {
            scheduledSemesters[child] = minChildSem;
            affectedCourses.add(child);

            if (!inQueue.has(child)) {
              queue.push(child);
              inQueue.add(child);
            }
          }
        });
      }
    }

    // Group courses by their new semesters
    const maxSem = Math.max(8, ...Object.values(scheduledSemesters));
    const semestersList: { number: number; courses: { course: CurriculumCourse; isAffected: boolean; isFailed: boolean; originalSem: number }[] }[] = [];

    for (let sem = 1; sem <= maxSem; sem++) {
      const coursesInSem = Object.entries(scheduledSemesters)
        .filter(([, s]) => s === sem)
        .map(([code]) => {
          const isFailed = code === selectedCourseToFail;
          return {
            course: courseMap[code],
            isAffected: affectedCourses.has(code) && !isFailed,
            isFailed,
            originalSem: originalSemesters[code] ?? sem,
          };
        });
      
      if (coursesInSem.length > 0 || sem <= 8) {
        semestersList.push({
          number: sem,
          courses: coursesInSem,
        });
      }
    }

    const origMaxSem = Math.max(8, ...curriculum.map(c => c.expected_semester));
    const delayAmount = Math.max(0, maxSem - origMaxSem);

    // Build the dependency path showing the chain
    const dependencyChain: string[] = [];
    if (isDelaySimulated && selectedCourseToFail) {
      // Run a quick trace of pushed courses to make a readable path
      dependencyChain.push(selectedCourseToFail);
      let current = selectedCourseToFail;
      while (true) {
        const children = childrenOf[current] ?? [];
        const affectedChild = children.find(c => affectedCourses.has(c) && scheduledSemesters[c] > originalSemesters[c]);
        if (affectedChild) {
          dependencyChain.push(affectedChild);
          current = affectedChild;
        } else {
          break;
        }
      }
    }

    return {
      semestersList,
      delayAmount,
      originalMaxSem: origMaxSem,
      newMaxSem: maxSem,
      affectedCount: affectedCourses.size - 1, // Exclude the failed course itself
      dependencyChain,
    };
  }, [curriculum, prereqs, selectedCourseToFail, retakeDelaySemesters, isDelaySimulated, hasAcademicData]);

  // Dropdown list for selection of courses to simulate failure (not passed yet)
  const failSimulatorCourseOptions = useMemo(() => {
    return curriculum.map(c => {
      const res = results.find(r => r.course_code === c.course_code);
      return {
        ...c,
        isPassed: res?.status === "PASSED",
      };
    }).filter(c => !c.isPassed);
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
          Giả lập & Dự phóng Tốt nghiệp &quot;What-If&quot;{profile?.full_name ? ` — ${profile.full_name}` : ""}
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
            <p className="text-sm font-semibold text-neutral-500">Đang đồng bộ dữ liệu chương trình học...</p>
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
            <Zap size={16} /> Chạy thử bản Demo mẫu (What-If)
          </button>
        </div>
      )}

      {/* Main Content Dashboard */}
      {!loading && !error && hasAcademicData && (
        <div className="space-y-6">
          
          {/* ── Top Dashboard Stats ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">GPA Hiện tại</span>
                <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                  <Award size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-neutral-900">{currentCumulativeGpa.toFixed(2)}</span>
                <span className="text-sm text-neutral-400 font-medium ml-1">/ 4.0</span>
                <p className="text-xs text-neutral-500 mt-1 font-medium">
                  Xếp loại tích lũy: <span className="font-bold text-emerald-600">
                    {currentCumulativeGpa >= 3.6 ? "Xuất sắc" : currentCumulativeGpa >= 3.2 ? "Giỏi" : currentCumulativeGpa >= 2.5 ? "Khá" : "Trung bình"}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tín chỉ hoàn thành</span>
                <div className="p-2 bg-violet-50 border border-violet-100 text-violet-600 rounded-xl">
                  <BookOpen size={18} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-neutral-900">{currentPassedCredits}</span>
                <span className="text-sm text-neutral-400 font-medium ml-1">/ {totalCurriculumCredits} TC</span>
                <div className="mt-2 w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-violet-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (currentPassedCredits / totalCurriculumCredits) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-1.5 font-medium">
                  Còn lại {remainingCredits} tín chỉ cần hoàn tất
                </p>
              </div>
            </div>

            <div className="bg-linear-to-br from-violet-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] font-bold text-violet-200 uppercase tracking-widest">GPA Giả lập live</span>
                <div className="p-2 bg-white/10 border border-white/20 text-white rounded-xl">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <span className="text-3xl font-extrabold">{simulatedGpaData.gpa.toFixed(2)}</span>
                <span className="text-sm text-violet-200 font-medium ml-1">/ 4.0</span>
                <p className="text-xs text-violet-100 mt-1 font-medium">
                  Tính trên tổng <span className="font-bold">{simulatedGpaData.credits} TC</span> (bao gồm điểm giả lập)
                </p>
              </div>
            </div>
          </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Target Inputs */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* target GPA box */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    <Sliders size={16} className="text-violet-600" />
                    Thiết lập mục tiêu đầu ra
                  </h3>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-semibold">Mục tiêu GPA tích lũy tốt nghiệp:</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="2.0"
                        max="4.0"
                        step="0.05"
                        value={targetGpa}
                        onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <span className="text-lg font-extrabold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 min-w-12.5 text-center">
                        {targetGpa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-neutral-400 font-bold block">Preset nhanh:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {CLASSIFICATIONS.map((c) => (
                        <button
                          key={c.label}
                          onClick={() => setTargetGpa(c.minGpa)}
                          className={`text-xs font-bold py-2 px-3 border rounded-xl transition-all text-center ${c.color} ${
                            targetGpa === c.minGpa ? "ring-2 ring-violet-500/20 border-violet-400" : ""
                          }`}
                        >
                          Bằng {c.label} (≥{c.minGpa.toFixed(2)})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* next semester GPA box */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    <Calendar size={16} className="text-indigo-600" />
                    Thử nghiệm GPA học kỳ tới
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Nhập GPA kỳ tới (ví dụ học kỳ này bạn muốn kéo điểm) để xem áp lực cho các kỳ tiếp theo giảm thế nào:
                  </p>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="4.0"
                      step="0.1"
                      placeholder="Nhập GPA kỳ vọng (e.g. 3.2)"
                      value={nextSemesterGpa}
                      onChange={(e) => setNextSemesterGpa(e.target.value)}
                      className="w-full text-sm font-medium border border-zinc-200 rounded-xl px-4.5 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                    />
                  </div>
                </div>

                {/* Calculation Info Note */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex gap-2 text-neutral-500 text-xs leading-relaxed">
                    <Info size={16} className="shrink-0 text-violet-500 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Công thức dự phóng</span>
                      <p>
                        GPA yêu cầu trung bình cho các môn còn lại được tự động tính toán dựa trên tổng số tín chỉ của chương trình và bảng điểm đã có.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Calculations Outputs and Interactive Course Mocking */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Projections calculation output board */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-neutral-900">Kết quả dự phóng & Khả thi</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-center">
                      <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">GPA còn lại tối thiểu cần đạt</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-extrabold ${requiredGpaOnRemaining > 4.0 ? "text-red-600" : "text-violet-600"}`}>
                          {remainingCredits > 0 ? requiredGpaOnRemaining.toFixed(2) : "0.00"}
                        </span>
                        <span className="text-sm text-neutral-400 font-medium">/ 4.0</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 font-medium">
                        (Tính cho trung bình {remainingCredits} tín chỉ còn lại)
                      </span>
                    </div>

                    <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between">
                      <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-1">Mức độ khả thi</span>
                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg border text-center ${feasibilityConfig.bg}`}>
                        {feasibilityConfig.text}
                      </span>
                      <p className="text-[10px] text-neutral-400 mt-2 font-medium">
                        {requiredGpaOnRemaining > 4.0 
                          ? "Bạn đã tích lũy điểm thấp, dù đạt 4.0 tất cả môn còn lại vẫn không đạt được mục tiêu này." 
                          : requiredGpaOnRemaining > 3.2 
                            ? "Khá thử thách. Bạn cần tập trung cao độ để giành được nhiều điểm giỏi/xuất sắc (A, B+)." 
                            : "Mục tiêu nằm trong tầm tay nếu duy trì sức học trung bình - khá hiện tại."}
                      </p>
                    </div>

                  </div>

                  {/* With next semester simulation */}
                  {nextSemesterProjection && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                        <Zap size={14} /> Kịch bản học kỳ tới:
                      </h4>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Nếu kỳ tới bạn đạt <span className="font-bold text-violet-700">{nextSemesterGpa} GPA</span> (giả định 15 tín chỉ), GPA tích lũy của bạn sẽ tăng lên <span className="font-bold text-violet-700">{nextSemesterProjection.projectedGpa.toFixed(2)}</span>. 
                        Áp lực các kỳ còn lại sau đó sẽ giảm: điểm trung bình cần đạt giảm từ <span className="font-semibold text-neutral-600">{requiredGpaOnRemaining.toFixed(2)}</span> xuống còn <span className="font-bold text-emerald-600">{nextSemesterProjection.newRequiredGpa.toFixed(2)}</span>!
                      </p>
                    </div>
                  )}
                </div>

                {/* Interactive Grade Mock Planner */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">Kế hoạch điểm số thử nghiệm (Mock Grades Planner)</h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Chọn điểm giả định cho các môn chưa học bên dưới để xem sự thay đổi trực tiếp của GPA.
                      </p>
                    </div>
                    {Object.keys(mockGrades).length > 0 && (
                      <button
                        onClick={() => setMockGrades({})}
                        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 font-semibold"
                      >
                        <RotateCcw size={12} /> Đặt lại
                      </button>
                    )}
                  </div>

                  <div className="space-y-6 max-h-125 overflow-y-auto pr-1">
                    {/* Group remaining courses by expected semester */}
                    {Array.from(new Set(remainingCourses.map(c => c.expected_semester))).sort((a, b) => a - b).map(semNum => {
                      const coursesInSem = remainingCourses.filter(c => c.expected_semester === semNum);
                      if (coursesInSem.length === 0) return null;

                      return (
                        <div key={semNum} className="space-y-2">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-l-2 border-violet-500 pl-2">
                            Học kỳ {semNum}
                          </h4>
                          
                          <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/20">
                            {coursesInSem.map(course => {
                              const result = results.find(r => r.course_code === course.course_code);
                              const isStudying = result?.status === "STUDYING";
                              const currentSelectedMock = mockGrades[course.course_code] || "NONE";

                              return (
                                <div key={course.course_code} className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors">
                                  <div className="space-y-0.5 max-w-[70%]">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-violet-600">{course.course_code}</span>
                                      {course.is_required && (
                                        <span className="bg-red-50 text-red-600 border border-red-100 px-1 py-0.2 rounded text-[8px] font-bold">
                                          Bắt buộc
                                        </span>
                                      )}
                                      {isStudying && (
                                        <span className="bg-amber-50 text-amber-600 border border-amber-100 px-1 py-0.2 rounded text-[8px] font-bold">
                                          Đang học
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-medium text-neutral-700 truncate">{course.course_name}</p>
                                    <p className="text-[10px] text-neutral-400">{course.credits} tín chỉ · {course.knowledge_block === "SPECIALIZED" ? "Chuyên ngành" : course.knowledge_block === "MAJOR_CORE" ? "Cơ sở ngành" : "Đại cương"}</p>
                                  </div>

                                  <div className="shrink-0">
                                    <select
                                      value={currentSelectedMock}
                                      onChange={(e) => setMockGrades(prev => ({
                                        ...prev,
                                        [course.course_code]: e.target.value
                                      }))}
                                      className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 outline-none cursor-pointer transition-colors ${
                                        currentSelectedMock !== "NONE"
                                          ? "bg-violet-50 text-violet-600 border-violet-200"
                                          : "bg-white text-neutral-400 border-zinc-200 hover:border-zinc-300"
                                      }`}
                                    >
                                      <option value="NONE">— Giả lập điểm —</option>
                                      {Object.keys(GRADE_VALUES).map(g => (
                                        <option key={g} value={g}>Điểm {g} ({GRADE_VALUES[g].toFixed(1)})</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ── TAB 2: PREREQUISITE DELAY SIMULATOR ───────────────── */}
          {activeTab === "delay" && simulatedRoadmap && (
            <div className="space-y-6">
              
              {/* Simulator controller panel */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-500" size={20} />
                  <h3 className="text-base font-bold text-neutral-900">Giả lập rủi ro: Nếu trượt môn tiên quyết</h3>
                </div>
                <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
                  Hệ thống sử dụng giải thuật duyệt đồ thị để tính toán ảnh hưởng dây chuyền. Nếu bạn trượt một môn tiên quyết, các môn chuyên ngành phía sau phụ thuộc trực tiếp/gián tiếp vào nó sẽ bị lùi tiến độ học tập, ảnh hưởng đến kỳ tốt nghiệp cuối cùng.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 border border-zinc-200 rounded-xl p-4.5">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-bold">Chọn môn giả lập trượt:</label>
                    <select
                      value={selectedCourseToFail}
                      onChange={(e) => {
                        setSelectedCourseToFail(e.target.value);
                        setIsDelaySimulated(false);
                      }}
                      className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
                    >
                      <option value="">— Chọn môn học chưa hoàn thành —</option>
                      {failSimulatorCourseOptions.map(c => (
                        <option key={c.course_code} value={c.course_code}>
                          {c.course_code} — {c.course_name} (Kỳ {c.expected_semester})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-500 font-bold">Thời gian lùi đăng ký lại (Mở lại lớp):</label>
                    <select
                      value={retakeDelaySemesters}
                      onChange={(e) => {
                        setRetakeDelaySemesters(Number(e.target.value));
                        setIsDelaySimulated(false);
                      }}
                      className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
                    >
                      <option value={1}>Lùi 1 học kỳ (Mở thường xuyên mỗi kỳ)</option>
                      <option value={2}>Lùi 2 học kỳ / 1 năm (Mở 1 lần / năm)</option>
                    </select>
                  </div>

                  <div>
                    <button
                      disabled={!selectedCourseToFail}
                      onClick={() => setIsDelaySimulated(true)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play size={14} /> Chạy giả lập rủi ro
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Output Banner */}
              {isDelaySimulated && selectedCourseToFail && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Thời gian tốt nghiệp</span>
                      <h4 className="text-xl font-black text-red-700 mt-2">
                        {simulatedRoadmap.delayAmount > 0 
                          ? `Bị chậm tốt nghiệp +${simulatedRoadmap.delayAmount} học kỳ`
                          : "Tốt nghiệp đúng hạn"}
                      </h4>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-3 font-medium">
                      Kỳ tốt nghiệp gốc: Kỳ {simulatedRoadmap.originalMaxSem} · Kỳ tốt nghiệp mới: Kỳ {simulatedRoadmap.newMaxSem}
                    </p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Số môn học bị ảnh hưởng</span>
                      <h4 className="text-xl font-black text-orange-700 mt-2">
                        {simulatedRoadmap.affectedCount} môn học bị đẩy lùi
                      </h4>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-3 font-medium">
                      Các môn có điều kiện tiên quyết nối tiếp đều bị lùi tương ứng.
                    </p>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Chuỗi ràng buộc dây chuyền</span>
                      {simulatedRoadmap.dependencyChain.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1 mt-2 text-xs font-mono font-bold text-neutral-600">
                          {simulatedRoadmap.dependencyChain.map((code, idx) => (
                            <React.Fragment key={code}>
                              {idx > 0 && <ArrowRight size={10} className="text-neutral-400 shrink-0" />}
                              <span className="bg-white px-2 py-0.5 border border-zinc-200 rounded text-neutral-700 shrink-0">
                                {code}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 mt-2">Không có môn chuyên ngành nối tiếp.</p>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-3 font-medium">
                      Đồ thị duyệt: BFS/Topological Dependency Path
                    </p>
                  </div>

                </div>
              )}

              {/* Visual Roadmap Grid */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-neutral-900">Bản đồ học tập và Tiến độ dự kiến (Timeline Roadmap)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {simulatedRoadmap.semestersList.map((sem) => (
                    <div 
                      key={sem.number} 
                      className={`border rounded-2xl p-4.5 bg-white shadow-sm flex flex-col gap-3 transition-all ${
                        sem.number > simulatedRoadmap.originalMaxSem 
                          ? "border-red-300 ring-2 ring-red-500/5 bg-red-50/10" 
                          : "border-zinc-200"
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                        <span className="text-xs font-black text-neutral-800">Học kỳ {sem.number}</span>
                        {sem.number > simulatedRoadmap.originalMaxSem && (
                          <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                            Kỳ phát sinh +{sem.number - simulatedRoadmap.originalMaxSem}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {sem.courses.length === 0 ? (
                          <p className="text-[10px] text-neutral-400 italic py-2">Không xếp học phần trong kỳ này</p>
                        ) : (
                          sem.courses.map(({ course, isAffected, isFailed, originalSem }) => {
                            let cardClass = "border-zinc-200 bg-white text-neutral-700";
                            let statusIcon = <CheckCircle2 size={12} className="text-emerald-500" />;
                            let badge = null;

                            const res = results.find(r => r.course_code === course.course_code);
                            const isPassed = res?.status === "PASSED";

                            if (isFailed) {
                              cardClass = "border-red-300 bg-red-50 text-red-700";
                              statusIcon = <XCircle size={12} className="text-red-500 animate-spin" />;
                              badge = "MÔN HỌC BỊ TRƯỢT";
                            } else if (isAffected) {
                              cardClass = "border-orange-300 bg-orange-50 text-orange-800";
                              statusIcon = <Clock size={12} className="text-orange-500 animate-pulse" />;
                              badge = `LÙI TỪ KỲ ${originalSem}`;
                            } else if (isPassed) {
                              cardClass = "border-emerald-200 bg-emerald-50/50 text-neutral-600";
                              statusIcon = <CheckCircle2 size={12} className="text-emerald-500" />;
                            } else if (res?.status === "STUDYING") {
                              cardClass = "border-zinc-200 bg-amber-50/30 text-neutral-700";
                              statusIcon = <Clock size={12} className="text-amber-500" />;
                            } else {
                              cardClass = "border-zinc-150 bg-zinc-50/20 text-neutral-500";
                              statusIcon = <BookOpen size={12} className="text-neutral-400" />;
                            }

                            return (
                              <div key={course.course_code} className={`border rounded-xl p-2.5 text-xs space-y-1 relative group hover:shadow-sm transition-all ${cardClass}`}>
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="font-mono font-bold">{course.course_code}</span>
                                  <div className="flex items-center gap-1.5">
                                    {statusIcon}
                                  </div>
                                </div>
                                <p className="font-medium truncate" title={course.course_name}>
                                  {course.course_name}
                                </p>
                                <div className="flex justify-between items-center text-[9px] text-neutral-400">
                                  <span>{course.credits} tín chỉ</span>
                                  {badge && (
                                    <span className="font-bold text-[8px] bg-white border px-1 py-0.2 rounded shrink-0">
                                      {badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
