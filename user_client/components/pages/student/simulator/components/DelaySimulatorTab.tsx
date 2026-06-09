import React from "react";
import { AlertTriangle, Play, ArrowRight, XCircle, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { CurriculumCourse, CourseResult } from "./types";

interface SemesterCourseItem {
  course: CurriculumCourse;
  isAffected: boolean;
  isFailed: boolean;
  originalSem: number;
}

interface SemesterGroup {
  number: number;
  courses: SemesterCourseItem[];
}

interface SimulatedRoadmap {
  semestersList: SemesterGroup[];
  delayAmount: number;
  originalMaxSem: number;
  newMaxSem: number;
  affectedCount: number;
  dependencyChain: string[];
}

interface DelaySimulatorTabProps {
  selectedCourseToFail: string;
  setSelectedCourseToFail: (val: string) => void;
  retakeDelaySemesters: number;
  setRetakeDelaySemesters: (val: number) => void;
  isDelaySimulated: boolean;
  setIsDelaySimulated: (val: boolean) => void;
  simulatedRoadmap: SimulatedRoadmap | null;
  failSimulatorCourseOptions: (CurriculumCourse & { isPassed: boolean })[];
  results: CourseResult[];
}

export function DelaySimulatorTab({
  selectedCourseToFail,
  setSelectedCourseToFail,
  retakeDelaySemesters,
  setRetakeDelaySemesters,
  isDelaySimulated,
  setIsDelaySimulated,
  simulatedRoadmap,
  failSimulatorCourseOptions,
  results,
}: DelaySimulatorTabProps) {
  if (!simulatedRoadmap) return null;

  return (
    <div className="space-y-6">
      {/* Simulator controller panel */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={20} />
          <h3 className="text-base font-bold text-neutral-900">
            Giả lập rủi ro: Nếu trượt môn tiên quyết
          </h3>
        </div>
        <p className="text-xs text-neutral-500 max-w-2xl leading-relaxed">
          Hệ thống sử dụng giải thuật duyệt đồ thị để tính toán ảnh hưởng dây
          chuyền. Nếu bạn trượt một môn tiên quyết, các môn chuyên ngành phía
          sau phụ thuộc trực tiếp/gián tiếp vào nó sẽ bị lùi tiến độ học tập, ảnh
          hưởng đến kỳ tốt nghiệp cuối cùng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 border border-zinc-200 rounded-xl p-4.5">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500 font-bold">
              Chọn môn giả lập trượt:
            </label>
            <select
              value={selectedCourseToFail}
              onChange={(e) => {
                setSelectedCourseToFail(e.target.value);
                setIsDelaySimulated(false);
              }}
              className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500"
            >
              <option value="">— Chọn môn học chưa hoàn thành —</option>
              {failSimulatorCourseOptions.map((c) => (
                <option key={c.course_code} value={c.course_code}>
                  {c.course_code} — {c.course_name} (Kỳ {c.expected_semester})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-500 font-bold">
              Thời gian lùi đăng ký lại (Mở lại lớp):
            </label>
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
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                Thời gian tốt nghiệp
              </span>
              <h4 className="text-xl font-black text-red-700 mt-2">
                {simulatedRoadmap.delayAmount > 0
                  ? `Bị chậm tốt nghiệp +${simulatedRoadmap.delayAmount} học kỳ`
                  : "Tốt nghiệp đúng hạn"}
              </h4>
            </div>
            <p className="text-[10px] text-neutral-500 mt-3 font-medium">
              Kỳ tốt nghiệp gốc: Kỳ {simulatedRoadmap.originalMaxSem} · Kỳ tốt
              nghiệp mới: Kỳ {simulatedRoadmap.newMaxSem}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                Số môn học bị ảnh hưởng
              </span>
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
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Chuỗi ràng buộc dây chuyền
              </span>
              {simulatedRoadmap.dependencyChain.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1 mt-2 text-xs font-mono font-bold text-neutral-600">
                  {simulatedRoadmap.dependencyChain.map((code, idx) => (
                    <React.Fragment key={code}>
                      {idx > 0 && (
                        <ArrowRight size={10} className="text-neutral-400 shrink-0" />
                      )}
                      <span className="bg-white px-2 py-0.5 border border-zinc-200 rounded text-neutral-700 shrink-0">
                        {code}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 mt-2">
                  Không có môn chuyên ngành nối tiếp.
                </p>
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
        <h3 className="text-base font-bold text-neutral-900">
          Bản đồ học tập và Tiến độ dự kiến (Timeline Roadmap)
        </h3>

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
                <span className="text-xs font-black text-neutral-800">
                  Học kỳ {sem.number}
                </span>
                {sem.number > simulatedRoadmap.originalMaxSem && (
                  <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                    Kỳ phát sinh +{sem.number - simulatedRoadmap.originalMaxSem}
                  </span>
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                {sem.courses.length === 0 ? (
                  <p className="text-[10px] text-neutral-400 italic py-2">
                    Không xếp học phần trong kỳ này
                  </p>
                ) : (
                  sem.courses.map(({ course, isAffected, isFailed, originalSem }) => {
                    let cardClass = "border-zinc-200 bg-white text-neutral-700";
                    let statusIcon = (
                      <CheckCircle2 size={12} className="text-emerald-500" />
                    );
                    let badge = null;

                    const res = results.find(
                      (r) => r.course_code === course.course_code
                    );
                    const isPassed = res?.status === "PASSED";

                    if (isFailed) {
                      cardClass = "border-red-300 bg-red-50 text-red-700";
                      statusIcon = (
                        <XCircle size={12} className="text-red-500 animate-spin" />
                      );
                      badge = "MÔN HỌC BỊ TRƯỢT";
                    } else if (isAffected) {
                      cardClass = "border-orange-300 bg-orange-50 text-orange-800";
                      statusIcon = (
                        <Clock size={12} className="text-orange-500 animate-pulse" />
                      );
                      badge = `LÙI TỪ KỲ ${originalSem}`;
                    } else if (isPassed) {
                      cardClass = "border-emerald-200 bg-emerald-50/50 text-neutral-600";
                      statusIcon = (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      );
                    } else if (res?.status === "STUDYING") {
                      cardClass = "border-zinc-200 bg-amber-50/30 text-neutral-700";
                      statusIcon = <Clock size={12} className="text-amber-500" />;
                    } else {
                      cardClass = "border-zinc-150 bg-zinc-50/20 text-neutral-500";
                      statusIcon = <BookOpen size={12} className="text-neutral-400" />;
                    }

                    return (
                      <div
                        key={course.course_code}
                        className={`border rounded-xl p-2.5 text-xs space-y-1 relative group hover:shadow-sm transition-all ${cardClass}`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono font-bold">{course.course_code}</span>
                          <div className="flex items-center gap-1.5">{statusIcon}</div>
                        </div>
                        <p
                          className="font-medium truncate"
                          title={course.course_name}
                        >
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
  );
}
