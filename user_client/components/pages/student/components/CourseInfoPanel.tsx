import React from "react";
import { BookOpen, HelpCircle, AlertTriangle } from "lucide-react";

interface CoursePrereqInfo {
  code: string;
  name: string;
}

interface CourseDetails {
  course_code: string;
  course_name: string;
  credits: number | string;
  expected_semester?: number;
  status: "PASSED" | "STUDYING" | "FAILED" | "MISSING" | "LOCKED";
  outDegree: number;
  prerequisites: CoursePrereqInfo[];
  dependents: CoursePrereqInfo[];
}

interface CourseInfoPanelProps {
  selectedCourseDetails: CourseDetails | null;
  onSimulateFailure?: (courseCode: string) => void;
}

export function CourseInfoPanel({ selectedCourseDetails, onSimulateFailure }: CourseInfoPanelProps) {
  return (
    <div className="w-full lg:w-80 bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
      <h3 className="text-base font-extrabold text-neutral-900 flex items-center gap-2 border-b border-zinc-150 pb-3">
        <BookOpen className="text-violet-600 shrink-0" size={18} />
        <span>Thông tin học phần</span>
      </h3>

      {!selectedCourseDetails ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
          <div className="h-12 w-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-300">
            <HelpCircle size={22} />
          </div>
          <p className="text-xs font-bold text-neutral-500 leading-relaxed max-w-50">
            Vui lòng click vào một môn học bất kỳ trong sơ đồ để xem thông tin chi tiết.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="space-y-1">
            <span className="text-[10px] font-black font-mono tracking-wide bg-violet-50 text-violet-700 px-2 py-0.5 border border-violet-100 rounded-md">
              {selectedCourseDetails.course_code}
            </span>
            <h4 className="text-sm font-extrabold text-neutral-950 leading-snug pt-1">
              {selectedCourseDetails.course_name}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3.5 bg-zinc-50 border border-zinc-150 rounded-2xl p-3.5 text-xs font-bold">
            <div className="space-y-0.5">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Tín chỉ</p>
              <p className="text-neutral-700 text-sm font-black">{selectedCourseDetails.credits} tín chỉ</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Kỳ kế hoạch</p>
              <p className="text-neutral-700 text-sm font-black">Học kỳ {selectedCourseDetails.expected_semester || "-"}</p>
            </div>
            <div className="col-span-2 space-y-0.5 pt-1 border-t border-zinc-200">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Trạng thái học vụ</p>
              <p
                className="text-sm font-extrabold"
                style={{
                  color:
                    selectedCourseDetails.status === "PASSED"
                      ? "#10b981"
                      : selectedCourseDetails.status === "STUDYING"
                      ? "#f59e0b"
                      : selectedCourseDetails.status === "FAILED"
                      ? "#ef4444"
                      : "#71717a",
                }}
              >
                {selectedCourseDetails.status === "PASSED" && "Đã hoàn thành"}
                {selectedCourseDetails.status === "STUDYING" && "Đang học kì hiện tại"}
                {selectedCourseDetails.status === "FAILED" && "Thi trượt (Cần học lại)"}
                {selectedCourseDetails.status === "MISSING" && "Khả dụng (Chưa học)"}
                {selectedCourseDetails.status === "LOCKED" && "Đang khóa (Thiếu môn tiên quyết)"}
              </p>
            </div>
          </div>

          {/* Out degree metrics / Bottleneck alert */}
          <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-3.5 text-xs space-y-1">
            <p className="font-extrabold text-violet-800 flex items-center gap-1">
              <span>Trọng số Ràng buộc (Out-Degree):</span>
              <span className="font-black text-sm text-violet-900 bg-white px-2 py-0.5 border rounded-md">
                {selectedCourseDetails.outDegree}
              </span>
            </p>
            <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
              {selectedCourseDetails.outDegree > 2 ? (
                <span className="text-amber-700 font-bold">
                  ⚠️ Đây là Môn học nút thắt! Nếu trượt môn này sẽ khóa học tối thiểu {selectedCourseDetails.outDegree} môn học chuyên ngành tiếp theo.
                </span>
              ) : (
                "Mức độ ảnh hưởng thấp khi học phần bị trễ."
              )}
            </p>
          </div>

          {/* Fail Simulator quick action */}
          {selectedCourseDetails.status !== "PASSED" && onSimulateFailure && (
            <button
              type="button"
              onClick={() => onSimulateFailure(selectedCourseDetails.course_code)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 text-xs font-bold transition cursor-pointer"
            >
              <AlertTriangle size={13} />
              Giả lập trượt môn này ⚠️
            </button>
          )}

          {/* Prerequisites list */}
          <div className="space-y-2">
            <h5 className="text-[10.5px] font-black text-neutral-500 uppercase tracking-wider">
              Học phần tiên quyết ({selectedCourseDetails.prerequisites.length})
            </h5>
            {selectedCourseDetails.prerequisites.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic">Không có điều kiện tiên quyết</p>
            ) : (
              <div className="space-y-1.5">
                {selectedCourseDetails.prerequisites.map((p) => (
                  <div
                    key={p.code}
                    className="border border-zinc-150 rounded-xl p-2 text-[10px] font-bold text-neutral-700 bg-zinc-50/50 flex justify-between gap-1.5"
                  >
                    <span className="font-mono text-neutral-500 shrink-0">{p.code}</span>
                    <span className="truncate flex-1 text-right">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct dependents list */}
          <div className="space-y-2">
            <h5 className="text-[10.5px] font-black text-neutral-500 uppercase tracking-wider">
              Môn học bị ràng buộc phía sau ({selectedCourseDetails.dependents.length})
            </h5>
            {selectedCourseDetails.dependents.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic">Không khóa môn học nào</p>
            ) : (
              <div className="space-y-1.5">
                {selectedCourseDetails.dependents.map((d) => (
                  <div
                    key={d.code}
                    className="border border-zinc-150 rounded-xl p-2 text-[10px] font-bold text-neutral-700 bg-zinc-50/50 flex justify-between gap-1.5"
                  >
                    <span className="font-mono text-neutral-500 shrink-0">{d.code}</span>
                    <span className="truncate flex-1 text-right">{d.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
