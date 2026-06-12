import React, { useState, useMemo, useEffect } from "react";
import { Sliders, Info, RotateCcw, Zap, ChevronDown } from "lucide-react";
import { CurriculumCourse, CourseResult, CLASSIFICATIONS, GRADE_VALUES } from "./types";

interface GpaProjectionTabProps {
  targetGpa: number;
  setTargetGpa: (val: number) => void;
  nextSemesterGpa: string;
  setNextSemesterGpa: (val: string) => void;
  remainingCredits: number;
  requiredGpaOnRemaining: number;
  feasibilityConfig: { text: string; bg: string; isFeasible: boolean };
  nextSemesterProjection: {
    projectedGpa: number;
    newRequiredGpa: number;
    isFeasible: boolean;
  } | null;
  remainingCourses: CurriculumCourse[];
  results: CourseResult[];
  mockGrades: Record<string, string>;
  setMockGrades: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function GpaProjectionTab({
  targetGpa,
  setTargetGpa,
  nextSemesterGpa,
  setNextSemesterGpa,
  remainingCredits,
  requiredGpaOnRemaining,
  feasibilityConfig,
  nextSemesterProjection,
  remainingCourses,
  results,
  mockGrades,
  setMockGrades,
}: GpaProjectionTabProps) {
  const [expandedSemesters, setExpandedSemesters] = useState<Record<number, boolean>>({});

  const remainingSemesters = useMemo(() => {
    return Array.from(new Set(remainingCourses.map((c) => c.expected_semester || 99)))
      .sort((a, b) => a - b);
  }, [remainingCourses]);

  // Set the first remaining semester expanded by default
  useEffect(() => {
    if (remainingSemesters.length > 0) {
      setExpandedSemesters({ [remainingSemesters[0]]: true });
    }
  }, [remainingSemesters]);

  const toggleSemester = (sem: number) => {
    setExpandedSemesters((prev) => ({
      ...prev,
      [sem]: !prev[sem],
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left Column: Settings Panel */}
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-5">
          <div className="border-b border-zinc-150 pb-3">
            <h3 className="text-sm font-extrabold text-neutral-900 flex items-center gap-1.5">
              <Sliders size={15} className="text-violet-650" />
              Thông số Giả lập GPA
            </h3>
          </div>

          {/* Target GPA input with slider and presets */}
          <div className="space-y-2.5">
            <label className="text-xs text-neutral-500 font-bold block">
              Mục tiêu GPA tích lũy tốt nghiệp:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2.0"
                max="4.0"
                step="0.05"
                value={targetGpa}
                onChange={(e) => setTargetGpa(parseFloat(e.target.value))}
                className="flex-1 accent-violet-600 cursor-pointer h-1.5 bg-zinc-150 rounded-lg appearance-none"
              />
              <span className="text-xs font-black text-violet-700 bg-violet-50 px-2 py-1 rounded-lg border border-violet-100 min-w-10 text-center font-mono">
                {targetGpa.toFixed(2)}
              </span>
            </div>
            
            {/* Presets grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {CLASSIFICATIONS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setTargetGpa(c.minGpa)}
                  className={`text-[10px] font-bold py-2 px-2 border rounded-xl transition-all text-center cursor-pointer ${
                    targetGpa === c.minGpa
                      ? "bg-violet-600 border-violet-600 text-white shadow-xs"
                      : "bg-white border-zinc-200 text-neutral-600 hover:border-zinc-300"
                  }`}
                >
                  Bằng {c.label} (≥{c.minGpa.toFixed(1)})
                </button>
              ))}
            </div>
          </div>

          {/* Test Next Semester GPA Input */}
          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <label className="text-xs text-neutral-500 font-bold block">
              Giả lập học tập kỳ tới:
            </label>
            <input
              type="number"
              min="0"
              max="4.0"
              step="0.1"
              placeholder="Nhập GPA kỳ tới (ví dụ: 3.2)"
              value={nextSemesterGpa}
              onChange={(e) => setNextSemesterGpa(e.target.value)}
              className="w-full text-xs font-bold border border-zinc-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 font-mono"
            />
            <p className="text-[10px] text-neutral-450 leading-relaxed font-medium">
              Nhập điểm kì vọng để xem mức độ giảm áp lực GPA cho các kỳ còn lại.
            </p>
          </div>
        </div>

        {/* Informational Help Note */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex gap-2.5 text-neutral-500 text-[11px] leading-relaxed">
          <Info size={15} className="shrink-0 text-violet-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-neutral-700">Công thức dự phóng</span>
            <p>
              GPA cần đạt được tính dựa trên số tín chỉ chưa học và điểm tích lũy thực tế của bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Outcomes and Collapsible Course Mock Planner */}
      <div className="lg:col-span-2 space-y-5">
        {/* Output Outcomes */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-neutral-900 border-b border-zinc-100 pb-2.5">
            Kết quả dự phóng & Khả thi
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-2xl p-4 flex flex-col justify-center">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                GPA trung bình cần đạt các môn còn lại
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-2xl font-black ${
                    requiredGpaOnRemaining > 4.0 ? "text-red-600" : "text-violet-650"
                  }`}
                >
                  {remainingCredits > 0 ? requiredGpaOnRemaining.toFixed(2) : "0.00"}
                </span>
                <span className="text-xs text-neutral-400 font-bold">/ 4.0</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                (Áp dụng cho {remainingCredits} tín chỉ còn lại)
              </span>
            </div>

            <div className="border border-zinc-200 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                Đánh giá mức độ khả thi
              </span>
              <span
                className={`inline-block text-[10.5px] font-bold px-2.5 py-1 rounded-lg border text-center ${
                  feasibilityConfig.bg
                }`}
              >
                {feasibilityConfig.text}
              </span>
              <p className="text-[10px] text-neutral-450 mt-2 font-medium">
                {requiredGpaOnRemaining > 4.0
                  ? "GPA tích lũy hiện tại thấp, mục tiêu này toán học không khả thi."
                  : requiredGpaOnRemaining > 3.2
                  ? "Đòi hỏi nỗ lực lớn, bạn cần đạt phần lớn các môn từ điểm B+ trở lên."
                  : "Mục tiêu nằm trong tầm tay nếu duy trì phong độ hiện tại."}
              </p>
            </div>
          </div>

          {/* Next Semester Scenario details */}
          {nextSemesterProjection && (
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-neutral-600">
              <Zap size={16} className="text-violet-655 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-violet-800">Kịch bản học kỳ tới: </span>
                <span>
                  Nếu đạt <strong>{nextSemesterGpa} GPA</strong> (quy đổi ~15 TC), GPA tích lũy sẽ tăng lên{" "}
                  <strong>{nextSemesterProjection.projectedGpa.toFixed(2)}</strong>. Yêu cầu cho các kỳ tiếp theo sẽ giảm từ{" "}
                  <span className="line-through">{requiredGpaOnRemaining.toFixed(2)}</span> xuống còn{" "}
                  <strong className="text-emerald-700">{nextSemesterProjection.newRequiredGpa.toFixed(2)}</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Mock Planner List */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">
                Kế hoạch điểm số thử nghiệm (Mock Grades Planner)
              </h3>
              <p className="text-[10.5px] text-neutral-400 mt-0.5">
                Chọn điểm giả lập cho từng môn học để thấy GPA tích lũy thay đổi theo thời gian thực.
              </p>
            </div>
            {Object.keys(mockGrades).length > 0 && (
              <button
                onClick={() => setMockGrades({})}
                className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-600 font-bold border border-zinc-200 rounded-lg px-2 py-1 bg-white cursor-pointer"
              >
                <RotateCcw size={10} /> Đặt lại
              </button>
            )}
          </div>

          {/* Group Remaining Courses into Collapsible Accordions */}
          <div className="space-y-3 max-h-120 overflow-y-auto pr-1">
            {remainingSemesters.map((semNum) => {
              const coursesInSem = remainingCourses.filter(
                (c) => (c.expected_semester || 99) === semNum
              );
              if (coursesInSem.length === 0) return null;

              const isExpanded = !!expandedSemesters[semNum];

              // Count how many courses have mocked grades in this semester
              const mockCount = coursesInSem.filter(c => mockGrades[c.course_code] && mockGrades[c.course_code] !== "NONE").length;

              return (
                <div key={semNum} className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {/* Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleSemester(semNum)}
                    className="w-full flex items-center justify-between p-3.5 bg-zinc-50/50 hover:bg-zinc-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-650" />
                      <span className="text-xs font-extrabold text-neutral-800">
                        Học kỳ {semNum}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold">
                        ({coursesInSem.length} môn)
                      </span>
                      {mockCount > 0 && (
                        <span className="bg-violet-100 text-violet-700 text-[8px] font-bold px-1.5 py-0.2 rounded border border-violet-200">
                          Đã giả lập {mockCount} môn
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Collapsible Body */}
                  {isExpanded && (
                    <div className="divide-y divide-zinc-100 bg-white">
                      {coursesInSem.map((course) => {
                        const result = results.find(
                          (r) => r.course_code === course.course_code
                        );
                        const isStudying = result?.status === "STUDYING";
                        const currentSelectedMock = mockGrades[course.course_code] || "NONE";

                        return (
                          <div
                            key={course.course_code}
                            className="p-3 flex items-center justify-between text-xs hover:bg-zinc-50/20 transition-colors gap-3"
                          >
                            <div className="space-y-0.5 max-w-[65%]">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="font-mono font-bold text-violet-655">
                                  {course.course_code}
                                </span>
                                {course.is_required && (
                                  <span className="bg-red-50 text-red-650 border border-red-100 px-1.5 py-0.2 rounded text-[8px] font-bold">
                                    Bắt buộc
                                  </span>
                                )}
                                {isStudying && (
                                  <span className="bg-amber-50 text-amber-650 border border-amber-100 px-1.5 py-0.2 rounded text-[8px] font-bold">
                                    Đang học
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-neutral-800 truncate" title={course.course_name}>
                                {course.course_name}
                              </p>
                              <p className="text-[10px] text-neutral-450 font-bold">
                                {course.credits} tín chỉ ·{" "}
                                {course.knowledge_block === "SPECIALIZED"
                                  ? "Chuyên ngành"
                                  : course.knowledge_block === "MAJOR_CORE"
                                  ? "Cơ sở ngành"
                                  : "Đại cương"}
                              </p>
                            </div>

                            <div className="shrink-0">
                              <select
                                value={currentSelectedMock}
                                onChange={(e) =>
                                  setMockGrades((prev) => ({
                                    ...prev,
                                    [course.course_code]: e.target.value,
                                  }))
                                }
                                className={`text-[11px] font-bold rounded-xl border px-2.5 py-2 outline-none cursor-pointer transition-colors ${
                                  currentSelectedMock !== "NONE"
                                    ? "bg-violet-50 text-violet-655 border-violet-200 shadow-inner"
                                    : "bg-white text-neutral-400 border-zinc-200 hover:border-zinc-300"
                                }`}
                              >
                                <option value="NONE">— Chưa giả lập —</option>
                                {Object.keys(GRADE_VALUES).map((g) => (
                                  <option key={g} value={g}>
                                    Điểm {g} ({GRADE_VALUES[g].toFixed(1)})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
