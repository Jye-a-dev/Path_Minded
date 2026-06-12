import { BookOpen, HelpCircle, GitFork, Bookmark, AlertTriangle } from "lucide-react";

interface CoursePrereqInfo {
  code: string;
  name: string;
  type?: string;
}

interface CourseDetails {
  course_code: string;
  course_name: string;
  credits?: number | string | null;
  expected_semester?: number;
  knowledge_block?: string | null;
  outDegree: number;
  prerequisites: CoursePrereqInfo[];
  dependents: CoursePrereqInfo[];
}

interface CourseInfoPanelProps {
  selectedCourseDetails: CourseDetails | null;
}

export function CourseInfoPanel({ selectedCourseDetails }: CourseInfoPanelProps) {
  return (
    <div className="w-full lg:w-80 bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col gap-4 text-slate-200">
      <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
        <BookOpen className="text-indigo-400 shrink-0" size={18} />
        <span>Thông tin học phần</span>
      </h3>

      {!selectedCourseDetails ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-500">
            <HelpCircle size={22} />
          </div>
          <p className="text-xs font-bold text-slate-400 leading-relaxed max-w-50">
            Vui lòng click vào một môn học bất kỳ trong sơ đồ để xem thông tin ràng buộc.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-black font-mono tracking-wide bg-indigo-500/10 text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded-md">
              {selectedCourseDetails.course_code}
            </span>
            <h4 className="text-sm font-extrabold text-white leading-snug pt-1">
              {selectedCourseDetails.course_name}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3.5 bg-slate-900/60 border border-slate-850 rounded-2xl p-3.5 text-xs font-bold">
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tín chỉ</p>
              <p className="text-white text-sm font-black">{selectedCourseDetails.credits ?? 0} tín chỉ</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kỳ kế hoạch</p>
              <p className="text-white text-sm font-black">Học kỳ {selectedCourseDetails.expected_semester || "-"}</p>
            </div>
            <div className="col-span-2 space-y-0.5 pt-1 border-t border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Khối kiến thức</p>
              <p className="text-indigo-400 text-xs font-bold mt-0.5">
                {selectedCourseDetails.knowledge_block || "-"}
              </p>
            </div>
          </div>

          {/* Out Degree Metrics */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-3.5 text-xs space-y-1">
            <p className="font-extrabold text-indigo-300 flex items-center gap-2">
              <span>Trọng số Ràng buộc (Out-Degree):</span>
              <span className="font-black text-sm text-white bg-slate-900 px-2 py-0.5 border border-slate-800 rounded-md">
                {selectedCourseDetails.outDegree}
              </span>
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
              {selectedCourseDetails.outDegree > 2 ? (
                <span className="text-amber-400 font-bold flex gap-1 items-start">
                  <AlertTriangle size={13} className="shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    ⚠️ Đây là Môn học nút thắt! Nếu trượt môn này sẽ khóa học tối thiểu {selectedCourseDetails.outDegree} môn học chuyên ngành tiếp theo.
                  </span>
                </span>
              ) : (
                "Mức độ ảnh hưởng thấp khi học phần bị trễ."
              )}
            </p>
          </div>

          {/* Prerequisites List */}
          <div className="space-y-2">
            <h5 className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <GitFork size={12} className="rotate-180" />
              <span>Điều kiện tiên quyết / Học trước ({selectedCourseDetails.prerequisites.length})</span>
            </h5>
            {selectedCourseDetails.prerequisites.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">Không có điều kiện tiên quyết</p>
            ) : (
              <div className="space-y-1.5">
                {selectedCourseDetails.prerequisites.map((p) => (
                  <div
                    key={p.code}
                    className="border border-slate-850 rounded-xl p-2.5 text-[10px] font-bold text-slate-300 bg-slate-900/30 flex flex-col gap-1 hover:bg-slate-900/60"
                  >
                    <div className="flex justify-between items-center gap-1.5">
                      <span className="font-mono text-slate-400 shrink-0">{p.code}</span>
                      {p.type && p.type !== 'REQUIRED' && (
                        <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-extrabold tracking-wider ${
                          p.type === 'PREVIOUS'
                            ? 'text-sky-450 bg-sky-500/10 border border-sky-500/20'
                            : p.type === 'RECOMMENDED'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-slate-400 bg-slate-500/10 border border-slate-500/20'
                        }`}>
                          {p.type === 'PREVIOUS' ? 'Học trước' : p.type === 'RECOMMENDED' ? 'Khuyến nghị' : p.type}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-white text-right font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct dependents list */}
          <div className="space-y-2">
            <h5 className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark size={12} className="text-indigo-400" />
              <span>Môn học bị ràng buộc phía sau ({selectedCourseDetails.dependents.length})</span>
            </h5>
            {selectedCourseDetails.dependents.length === 0 ? (
              <p className="text-[10px] text-slate-500 italic">Không khóa môn học nào</p>
            ) : (
              <div className="space-y-1.5">
                {selectedCourseDetails.dependents.map((d) => (
                  <div
                    key={d.code}
                    className="border border-slate-850 rounded-xl p-2.5 text-[10px] font-bold text-slate-300 bg-slate-900/30 flex flex-col gap-1 hover:bg-slate-900/60"
                  >
                    <div className="flex justify-between items-center gap-1.5">
                      <span className="font-mono text-slate-400 shrink-0">{d.code}</span>
                      {d.type && d.type !== 'REQUIRED' && (
                        <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-extrabold tracking-wider ${
                          d.type === 'PREVIOUS'
                            ? 'text-sky-450 bg-sky-500/10 border border-sky-500/20'
                            : d.type === 'RECOMMENDED'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-slate-400 bg-slate-500/10 border border-slate-500/20'
                        }`}>
                          {d.type === 'PREVIOUS' ? 'Học trước' : d.type === 'RECOMMENDED' ? 'Khuyến nghị' : d.type}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-white text-right font-medium">{d.name}</span>
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
