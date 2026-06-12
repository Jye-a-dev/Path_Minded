import React, { useState, useMemo, useEffect, useRef } from "react";
import { AlertTriangle, Play, ArrowRight, Clock, Info, Search, X } from "lucide-react";
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
  affectedCourses: { course_code: string; course_name: string; delay: number }[];
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
}: DelaySimulatorTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    return failSimulatorCourseOptions.filter(
      (c) =>
        c.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.course_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [failSimulatorCourseOptions, searchQuery]);

  const selectedCourseName = useMemo(() => {
    const found = failSimulatorCourseOptions.find(c => c.course_code === selectedCourseToFail);
    return found ? `${found.course_code} — ${found.course_name}` : "";
  }, [selectedCourseToFail, failSimulatorCourseOptions]);

  if (!simulatedRoadmap) return null;

  return (
    <div className="space-y-6">
      {/* Simulator controller panel */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2.5">
          <AlertTriangle className="text-red-500" size={18} />
          <h3 className="text-sm font-extrabold text-neutral-900">
            Giả lập rủi ro: Nếu trượt môn tiên quyết
          </h3>
        </div>
        <p className="text-xs text-neutral-450 leading-relaxed font-medium">
          Hệ thống quét sơ đồ đào tạo để phát hiện ảnh hưởng dây chuyền. Trượt môn tiên quyết sẽ đẩy lùi tiến độ học tập của các môn chuyên ngành phía sau, ảnh hưởng trực tiếp đến thời gian ra trường.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
          {/* Custom Searchable combobox input */}
          <div ref={dropdownRef} className="space-y-1.5 relative">
            <label className="text-xs text-neutral-500 font-bold block">
              Chọn môn giả lập trượt:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm mã/tên môn học..."
                value={isOpenSuggestions ? searchQuery : selectedCourseName}
                onFocus={() => {
                  setIsOpenSuggestions(true);
                  setSearchQuery("");
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-2.5 outline-none focus:border-violet-500"
              />
              {selectedCourseToFail ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourseToFail("");
                    setSearchQuery("");
                    setIsDelaySimulated(false);
                  }}
                  className="absolute right-2.5 top-2.5 p-0.5 text-neutral-400 hover:text-neutral-600 bg-neutral-100 rounded-md transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              ) : (
                <Search size={14} className="absolute right-3 top-3.5 text-neutral-400 pointer-events-none" />
              )}

              {/* Suggestions Panel */}
              {isOpenSuggestions && (
                <div className="absolute z-30 top-full left-0 w-full mt-1.5 max-h-60 overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-xl divide-y divide-zinc-100 animate-fadeIn">
                  {filteredOptions.length === 0 ? (
                    <div className="p-4 text-xs text-neutral-400 italic text-center">
                      Không tìm thấy môn học nào
                    </div>
                  ) : (
                    filteredOptions.map((c) => (
                      <button
                        key={c.course_code}
                        type="button"
                        onClick={() => {
                          setSelectedCourseToFail(c.course_code);
                          setIsOpenSuggestions(false);
                          setIsDelaySimulated(false);
                        }}
                        className="w-full text-left p-3 text-xs hover:bg-neutral-50 flex items-center justify-between transition-colors gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-violet-655 block text-[10px]">
                            {c.course_code}
                          </span>
                          <p className="font-bold text-neutral-800 truncate">{c.course_name}</p>
                        </div>
                        <span className="shrink-0 bg-zinc-100 text-neutral-450 text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-150">
                          Kỳ {c.expected_semester}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-neutral-500 font-bold block">
              Thời gian mở lại lớp để đăng ký lại:
            </label>
            <select
              value={retakeDelaySemesters}
              onChange={(e) => {
                setRetakeDelaySemesters(Number(e.target.value));
                setIsDelaySimulated(false);
              }}
              className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value={1}>Lùi 1 học kỳ (Mở thường xuyên mỗi kỳ)</option>
              <option value={2}>Lùi 2 học kỳ / 1 năm (Mở 1 lần / năm)</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              disabled={!selectedCourseToFail}
              onClick={() => setIsDelaySimulated(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Play size={13} /> Chạy giả lập rủi ro
            </button>
          </div>
        </div>
      </div>

      {/* Visual selector grid when not simulated */}
      {!isDelaySimulated && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="lg:col-span-1 bg-zinc-50 border border-zinc-200 border-dashed rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-zinc-150 text-neutral-450 shadow-xs">
              <Info size={20} className="text-violet-550 shrink-0" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-neutral-800">Sẵn sàng chạy giả lập</h4>
              <p className="text-[11px] text-neutral-450 leading-relaxed font-semibold max-w-xs mx-auto">
                Nhấp chọn nhanh môn học từ danh sách bên phải hoặc tìm kiếm trong ô nhập phía trên, sau đó bấm <strong>&quot;Chạy giả lập rủi ro&quot;</strong>.
              </p>
            </div>
          </div>

          {/* Visual remaining courses grid */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold text-neutral-800 border-b border-zinc-100 pb-2.5">
              Danh sách học phần chưa hoàn thành:
            </h4>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {Array.from(new Set(failSimulatorCourseOptions.map(c => c.expected_semester || 99)))
                .sort((a, b) => a - b)
                .map(semNum => {
                  const coursesInSem = failSimulatorCourseOptions.filter(c => c.expected_semester === semNum);
                  if (coursesInSem.length === 0) return null;
                  
                  return (
                    <div key={semNum} className="space-y-2">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                        Học kỳ {semNum}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coursesInSem.map(course => {
                          const isSelected = selectedCourseToFail === course.course_code;
                          return (
                            <button
                              key={course.course_code}
                              type="button"
                              onClick={() => {
                                setSelectedCourseToFail(course.course_code);
                                setIsDelaySimulated(false);
                              }}
                              className={`border text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col justify-between h-20 ${
                                isSelected
                                  ? "bg-red-50/70 border-red-500 ring-2 ring-red-500/10 shadow-xs"
                                  : "bg-zinc-50/20 border-zinc-150 hover:border-zinc-350 hover:bg-zinc-50/10"
                              }`}
                            >
                              <div className="w-full flex items-center justify-between gap-1.5 text-[9px] font-bold text-neutral-400">
                                <span className={isSelected ? "text-red-700 font-mono font-extrabold" : "font-mono"}>
                                  {course.course_code}
                                </span>
                                {course.is_required && (
                                  <span className="bg-red-50 text-red-650 border border-red-100 px-1.5 py-0.2 rounded text-[7px] font-bold">
                                    Bắt buộc
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs font-bold truncate w-full ${isSelected ? "text-red-900" : "text-neutral-850"}`} title={course.course_name}>
                                {course.course_name}
                              </p>
                              <div className="w-full flex justify-between items-center text-[9px] font-bold text-neutral-500">
                                <span>{course.credits} tín chỉ</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Simulation Output Banner */}
      {isDelaySimulated && selectedCourseToFail && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-red-50/50 border border-red-200 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">
                  Thời gian tốt nghiệp
                </span>
                <h4 className="text-lg font-black text-red-700 mt-1.5">
                  {simulatedRoadmap.delayAmount > 0
                    ? `Bị chậm tốt nghiệp +${simulatedRoadmap.delayAmount} học kỳ`
                    : "Tốt nghiệp đúng hạn"}
                </h4>
              </div>
              <p className="text-[10px] text-neutral-450 mt-3 font-semibold">
                Kỳ gốc: Kỳ {simulatedRoadmap.originalMaxSem} · Kỳ giả lập mới: Kỳ {simulatedRoadmap.newMaxSem}
              </p>
            </div>

            <div className="bg-orange-50/50 border border-orange-200 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
                  Số môn học bị ảnh hưởng
                </span>
                <h4 className="text-lg font-black text-orange-700 mt-1.5">
                  {simulatedRoadmap.affectedCount} học phần bị đẩy lùi
                </h4>
              </div>
              <p className="text-[10px] text-neutral-450 mt-3 font-semibold">
                Các môn chuyên ngành nối tiếp đều bị lùi tương ứng.
              </p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Chuỗi ràng buộc dây chuyền
                </span>
                {simulatedRoadmap.dependencyChain.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] font-mono font-bold text-neutral-600">
                    {simulatedRoadmap.dependencyChain.map((code, idx) => (
                      <React.Fragment key={code}>
                        {idx > 0 && (
                          <ArrowRight size={10} className="text-neutral-400 shrink-0" />
                        )}
                        <span className="bg-white px-1.5 py-0.5 border border-zinc-200 rounded text-neutral-700 shrink-0">
                          {code}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 mt-2 font-medium">
                    Không có môn chuyên ngành nối tiếp.
                  </p>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 mt-3 font-medium">
                Đồ thị duyệt: Prerequisite Dependency Path
              </p>
            </div>
          </div>

          {/* List of affected courses */}
          {simulatedRoadmap.affectedCount > 0 && (
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-extrabold text-neutral-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                Danh sách học phần bị chậm tiến độ ({simulatedRoadmap.affectedCount})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {simulatedRoadmap.affectedCourses.map((c) => (
                  <div
                    key={c.course_code}
                    className="border border-orange-200/60 bg-orange-50/10 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-mono font-bold text-orange-700">
                        {c.course_code}
                      </span>
                      <p className="font-bold text-neutral-800 truncate" title={c.course_name}>
                        {c.course_name}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-800 border border-orange-100 px-2.5 py-1 rounded-xl text-[9px] font-bold">
                        <Clock size={11} /> Trễ {c.delay} kỳ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
