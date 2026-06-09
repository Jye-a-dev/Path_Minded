import React from "react";
import { Sliders, Calendar, Info, RotateCcw, Zap } from "lucide-react";
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
  return (
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
            <label className="text-xs text-neutral-500 font-semibold">
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
                className="w-full accent-violet-600 cursor-pointer"
              />
              <span className="text-lg font-extrabold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 min-w-12.5 text-center">
                {targetGpa.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-neutral-400 font-bold block">
              Preset nhanh:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {CLASSIFICATIONS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => setTargetGpa(c.minGpa)}
                  className={`text-xs font-bold py-2 px-3 border rounded-xl transition-all text-center ${
                    c.color
                  } ${
                    targetGpa === c.minGpa
                      ? "ring-2 ring-violet-500/20 border-violet-400"
                      : ""
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
            Nhập GPA kỳ tới (ví dụ học kỳ này bạn muốn kéo điểm) để xem áp lực
            cho các kỳ tiếp theo giảm thế nào:
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
              <span className="font-bold text-neutral-700">
                Công thức dự phóng
              </span>
              <p>
                GPA yêu cầu trung bình cho các môn còn lại được tự động tính
                toán dựa trên tổng số tín chỉ của chương trình và bảng điểm đã
                có.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Calculations Outputs and Interactive Course Mocking */}
      <div className="lg:col-span-2 space-y-6">
        {/* Projections calculation output board */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-neutral-900">
            Kết quả dự phóng & Khả thi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-center">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                GPA còn lại tối thiểu cần đạt
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-extrabold ${
                    requiredGpaOnRemaining > 4.0
                      ? "text-red-600"
                      : "text-violet-600"
                  }`}
                >
                  {remainingCredits > 0 ? requiredGpaOnRemaining.toFixed(2) : "0.00"}
                </span>
                <span className="text-sm text-neutral-400 font-medium ml-0.5">
                  / 4.0
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 mt-1 font-medium">
                (Tính cho trung bình {remainingCredits} tín chỉ còn lại)
              </span>
            </div>

            <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                Mức độ khả thi
              </span>
              <span
                className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg border text-center ${
                  feasibilityConfig.bg
                }`}
              >
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
                Nếu kỳ tới bạn đạt{" "}
                <span className="font-bold text-violet-700">
                  {nextSemesterGpa} GPA
                </span>{" "}
                (giả định 15 tín chỉ), GPA tích lũy của bạn sẽ tăng lên{" "}
                <span className="font-bold text-violet-700">
                  {nextSemesterProjection.projectedGpa.toFixed(2)}
                </span>
                . Áp lực các kỳ còn lại sau đó sẽ giảm: điểm trung bình cần đạt
                giảm từ{" "}
                <span className="font-semibold text-neutral-600">
                  {requiredGpaOnRemaining.toFixed(2)}
                </span>{" "}
                xuống còn{" "}
                <span className="font-bold text-emerald-600">
                  {nextSemesterProjection.newRequiredGpa.toFixed(2)}
                </span>
                !
              </p>
            </div>
          )}
        </div>

        {/* Interactive Grade Mock Planner */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Kế hoạch điểm số thử nghiệm (Mock Grades Planner)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Chọn điểm giả định cho các môn chưa học bên dưới để xem sự thay
                đổi trực tiếp của GPA.
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
            {Array.from(new Set(remainingCourses.map((c) => c.expected_semester)))
              .sort((a, b) => a - b)
              .map((semNum) => {
                const coursesInSem = remainingCourses.filter(
                  (c) => c.expected_semester === semNum
                );
                if (coursesInSem.length === 0) return null;

                return (
                  <div key={semNum} className="space-y-2">
                    <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-l-2 border-violet-500 pl-2">
                      Học kỳ {semNum}
                    </h4>

                    <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/20">
                      {coursesInSem.map((course) => {
                        const result = results.find(
                          (r) => r.course_code === course.course_code
                        );
                        const isStudying = result?.status === "STUDYING";
                        const currentSelectedMock =
                          mockGrades[course.course_code] || "NONE";

                        return (
                          <div
                            key={course.course_code}
                            className="p-3 flex items-center justify-between text-xs hover:bg-white transition-colors"
                          >
                            <div className="space-y-0.5 max-w-[70%]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-violet-600">
                                  {course.course_code}
                                </span>
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
                              <p className="font-medium text-neutral-700 truncate">
                                {course.course_name}
                              </p>
                              <p className="text-[10px] text-neutral-400">
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
                                className={`text-xs font-bold rounded-lg border px-2.5 py-1.5 outline-none cursor-pointer transition-colors ${
                                  currentSelectedMock !== "NONE"
                                    ? "bg-violet-50 text-violet-600 border-violet-200"
                                    : "bg-white text-neutral-400 border-zinc-200 hover:border-zinc-300"
                                }`}
                              >
                                <option value="NONE">— Giả lập điểm —</option>
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
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
