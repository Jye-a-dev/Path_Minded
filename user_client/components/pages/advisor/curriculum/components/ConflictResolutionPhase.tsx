import React, { useState, useEffect } from "react";
import { AlertTriangle, Edit3, Check, Database, FileSpreadsheet, Sliders } from "lucide-react";
import CurriculumSheetSelector from "./CurriculumSheetSelector";

export interface ConflictItem {
  courseCode: string;
  diffFields: string[];
  dbRecord: {
    course_name: string;
    credits: number;
    theory_hours: number | null;
    practice_hours: number | null;
    knowledge_block: string;
  };
  excelRecord: {
    courseCode: string;
    courseName: string;
    credits: number | null;
    theoryHours: number | null;
    practiceHours: number | null;
    knowledgeBlock: string;
  };
}

export interface CustomCourseEdit {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  knowledgeBlock: string;
}

export interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
}

interface ConflictResolutionPhaseProps {
  conflicts: ConflictItem[];
  previewCourses: CoursePreviewItem[];
  onCancel: () => void;
  onConfirm: (updatedCourses: CoursePreviewItem[]) => void;
  sheets?: string[];
  activeSheetIndex?: number;
  onSheetChange?: (index: number) => void;
}

export default function ConflictResolutionPhase({
  conflicts,
  previewCourses,
  onCancel,
  onConfirm,
  sheets,
  activeSheetIndex,
  onSheetChange
}: ConflictResolutionPhaseProps) {
  const [resolutions, setResolutions] = useState<Record<string, "db" | "excel" | "custom">>({});
  const [customEdits, setCustomEdits] = useState<Record<string, CustomCourseEdit>>({});
  const [editingConflictCode, setEditingConflictCode] = useState<string | null>(null);
  const [conflictEditForm, setConflictEditForm] = useState<CustomCourseEdit | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const initialRes: Record<string, "db" | "excel"> = {};
      conflicts.forEach((c) => {
        initialRes[c.courseCode] = "excel";
      });
      setResolutions(initialRes);
    }, 0);
    return () => clearTimeout(timer);
  }, [conflicts]);

  const handleStartCustomEdit = (conflict: ConflictItem) => {
    setEditingConflictCode(conflict.courseCode);
    setConflictEditForm({
      courseCode: customEdits[conflict.courseCode]?.courseCode || conflict.excelRecord.courseCode,
      courseName: customEdits[conflict.courseCode]?.courseName || conflict.excelRecord.courseName,
      credits: customEdits[conflict.courseCode]?.credits ?? conflict.excelRecord.credits,
      theoryHours: customEdits[conflict.courseCode]?.theoryHours ?? conflict.excelRecord.theoryHours,
      practiceHours: customEdits[conflict.courseCode]?.practiceHours ?? conflict.excelRecord.practiceHours,
      knowledgeBlock: customEdits[conflict.courseCode]?.knowledgeBlock || conflict.excelRecord.knowledgeBlock
    });
  };

  const handleSaveCustomEdit = () => {
    if (editingConflictCode && conflictEditForm) {
      setCustomEdits((prev) => ({ ...prev, [editingConflictCode]: conflictEditForm }));
      setResolutions((prev) => ({ ...prev, [editingConflictCode]: "custom" }));
      setEditingConflictCode(null);
      setConflictEditForm(null);
    }
  };

  const handleResolveAll = (type: "db" | "excel") => {
    const next: Record<string, "db" | "excel" | "custom"> = { ...resolutions };
    conflicts.forEach((c) => {
      next[c.courseCode] = type;
    });
    setResolutions(next);
  };

  const handleConfirm = () => {
    const updatedCourses: CoursePreviewItem[] = [];

    for (const course of previewCourses) {
      const code = course.courseCode;
      const resolution = resolutions[code];
      const conflict = conflicts.find((c) => c.courseCode === code);

      if (!resolution || !conflict) {
        updatedCourses.push(course);
        continue;
      }

      if (resolution === "db") {
        updatedCourses.push({
          ...course,
          courseName: conflict.dbRecord.course_name,
          credits: conflict.dbRecord.credits,
          theoryHours: conflict.dbRecord.theory_hours,
          practiceHours: conflict.dbRecord.practice_hours,
          knowledgeBlock: conflict.dbRecord.knowledge_block
        });
      } else if (resolution === "custom" && customEdits[code]) {
        const edit = customEdits[code];
        const newCourseCode = edit.courseCode || code;

        if (newCourseCode !== code) {
          updatedCourses.push(course); // Keep original DB course
          updatedCourses.push({
            ...course,
            courseCode: newCourseCode,
            courseName: edit.courseName ?? course.courseName,
            credits: edit.credits ?? course.credits,
            theoryHours: edit.theoryHours ?? course.theoryHours,
            practiceHours: edit.practiceHours ?? course.practiceHours,
            knowledgeBlock: edit.knowledgeBlock ?? course.knowledgeBlock
          });
        } else {
          updatedCourses.push({
            ...course,
            ...edit,
            courseCode: newCourseCode
          });
        }
      } else {
        updatedCourses.push(course);
      }
    }

    onConfirm(updatedCourses);
  };

  const getKnowledgeBlockName = (block: string) => {
    if (block === "GENERAL") return "Đại cương";
    if (block === "SECTOR_CORE") return "Cơ sở khối ngành";
    if (block === "MAJOR_CORE") return "Cơ sở ngành";
    if (block === "SPECIALIZED") return "Chuyên ngành";
    return block;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sheet Selector */}
      {sheets && sheets.length > 1 && onSheetChange && (
        <CurriculumSheetSelector
          sheets={sheets}
          activeSheetIndex={activeSheetIndex || 0}
          onSheetSelect={onSheetChange}
        />
      )}

      {/* Banner warning */}
      <div className="rounded-2xl border border-amber-250 bg-amber-50/50 backdrop-blur-xs p-5 flex gap-4 relative z-10">
        <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <span className="text-sm font-extrabold text-amber-900 block tracking-wide">
            Phát hiện {conflicts.length} học phần có xung đột dữ liệu!
          </span>
          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
            Các học phần dưới đây đã tồn tại trong CSDL chương trình đào tạo nhưng có sự sai lệch thuộc tính (tên, tín chỉ, giờ học...) so với tệp bạn mới tải lên. Vui lòng đối soát và lựa chọn phương án lưu trữ.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-800 font-bold bg-amber-100/50 w-fit px-2.5 py-1 rounded-lg border border-amber-200/50">
            <span>💡 Gợi ý gộp phiên bản (Versioning):</span>
            <span className="font-normal text-neutral-600">Đổi Mã học phần sang dạng `MÃ_V2` trong phần Tùy biến để lưu song song cả hai phiên bản.</span>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 border border-zinc-200 rounded-3xl shadow-sm relative z-10">
        <div className="space-y-0.5">
          <span className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider block font-mono">Xử lý hàng loạt</span>
          <p className="text-xs text-neutral-500 font-semibold">Áp dụng một lựa chọn chung cho tất cả {conflicts.length} học phần có xung đột.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleResolveAll("db")}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 px-4 py-2.5 text-xs font-extrabold text-emerald-800 transition cursor-pointer active:scale-98"
          >
            <Database size={13} />
            Giữ cũ tất cả (DB)
          </button>
          <button
            type="button"
            onClick={() => handleResolveAll("excel")}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 px-4 py-2.5 text-xs font-extrabold text-blue-800 transition cursor-pointer active:scale-98"
          >
            <FileSpreadsheet size={13} />
            Ghi đè tất cả (Excel)
          </button>
        </div>
      </div>

      {/* List of conflicts */}
      <div className="space-y-6 relative z-10">
        {conflicts.map((conflict) => {
          const choice = resolutions[conflict.courseCode] || "excel";
          const isCustom = choice === "custom";
          const currentCustom = customEdits[conflict.courseCode];

          return (
            <div
              key={conflict.courseCode}
              className="rounded-3xl border bg-white/95 backdrop-blur-md p-6 space-y-5 shadow-lg transition-all duration-300 hover:shadow-xl"
              style={{
                borderColor:
                  choice === "db"
                    ? "#10b981"
                    : choice === "excel"
                      ? "#3b82f6"
                      : "#8b5cf6"
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-150 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 shadow-md">
                    {isCustom && currentCustom?.courseCode && currentCustom.courseCode !== conflict.courseCode ? (
                      <span className="flex items-center gap-1.5">
                        {conflict.courseCode}
                        <span className="text-violet-400">→</span>
                        <span className="text-violet-300 font-extrabold">{currentCustom.courseCode}</span>
                      </span>
                    ) : (
                      conflict.courseCode
                    )}
                  </span>
                  <div>
                    <span className="text-sm font-extrabold text-neutral-900 block">Đối soát dữ liệu</span>
                    <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block font-mono mt-0.5">Xung đột thuộc tính</span>
                  </div>
                </div>

                {/* Segmented Control Selector */}
                <div className="flex items-center bg-neutral-100 p-1 rounded-2xl border border-zinc-200 text-xs font-bold shrink-0 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "db" }))}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition cursor-pointer ${
                      choice === "db"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Database size={13} />
                    Giữ cũ (DB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "excel" }))}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition cursor-pointer ${
                      choice === "excel"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <FileSpreadsheet size={13} />
                    Ghi đè (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCustomEdit(conflict)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition cursor-pointer ${
                      isCustom
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/10"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <Sliders size={13} />
                    {isCustom ? "Đã tùy biến" : "Tùy biến"}
                  </button>
                </div>
              </div>

              {/* Editing custom panel */}
              {editingConflictCode === conflict.courseCode && conflictEditForm && (
                <div className="p-5 rounded-2xl border border-violet-100 bg-violet-50/20 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <span className="text-xs font-extrabold text-violet-900 flex items-center gap-1.5">
                    <Edit3 size={14} className="text-violet-600" />
                    Chỉnh sửa thuộc tính / Gộp phiên bản học phần
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-neutral-500 flex items-center gap-1.5">
                        Mã học phần:
                        <span className="text-violet-600 text-[10px] font-bold font-mono uppercase">(Tạo song song, Ví dụ: {conflict.courseCode}_V2)</span>
                      </label>
                      <input
                        type="text"
                        value={conflictEditForm.courseCode}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseCode: e.target.value.toUpperCase().trim() })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-neutral-800 font-mono uppercase focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-neutral-500">Tên học phần:</label>
                      <input
                        type="text"
                        value={conflictEditForm.courseName}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseName: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-500">Số tín chỉ:</label>
                      <input
                        type="number"
                        value={conflictEditForm.credits ?? ""}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, credits: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-neutral-500">Khối kiến thức:</label>
                      <select
                        value={conflictEditForm.knowledgeBlock}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, knowledgeBlock: e.target.value })}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-neutral-800 cursor-pointer focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all"
                      >
                        <option value="GENERAL">Đại cương</option>
                        <option value="SECTOR_CORE">Cơ sở khối ngành</option>
                        <option value="MAJOR_CORE">Cơ sở ngành</option>
                        <option value="SPECIALIZED">Chuyên ngành</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingConflictCode(null); setConflictEditForm(null); }}
                      className="rounded-xl px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-bold transition cursor-pointer"
                    >
                      Hủy chỉnh sửa
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomEdit}
                      className="rounded-xl px-4.5 py-2 bg-violet-600 hover:bg-violet-55 text-white text-xs font-bold transition shadow-md shadow-violet-500/10 cursor-pointer"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}

              {/* Comparisons layout side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DB Version card */}
                <div className={`p-4 border rounded-2xl transition-all duration-300 space-y-2.5 text-xs ${
                  choice === "db"
                    ? "border-emerald-200 bg-emerald-50/20 shadow-inner"
                    : "border-zinc-200 bg-neutral-50/40 opacity-70"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider font-mono">Phiên bản trong CSDL</span>
                    {choice === "db" && <div className="h-4.5 w-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check size={10} strokeWidth={3} /></div>}
                  </div>
                  <div className="space-y-1 text-neutral-700 font-medium">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tên môn:</span>
                      <span className={`font-semibold ${conflict.diffFields.includes("courseName") && choice !== "db" ? "text-rose-600" : "text-neutral-800"}`}>
                        {conflict.dbRecord.course_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tín chỉ:</span>
                      <span className={`font-bold font-mono ${conflict.diffFields.includes("credits") && choice !== "db" ? "text-rose-600" : "text-neutral-850"}`}>
                        {conflict.dbRecord.credits} tín chỉ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Khối kiến thức:</span>
                      <span className={`font-semibold ${conflict.diffFields.includes("knowledgeBlock") && choice !== "db" ? "text-rose-600" : "text-neutral-800"}`}>
                        {getKnowledgeBlockName(conflict.dbRecord.knowledge_block)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Excel/Custom Version card */}
                <div className={`p-4 border rounded-2xl transition-all duration-300 space-y-2.5 text-xs ${
                  choice === "excel"
                    ? "border-blue-200 bg-blue-50/20 shadow-inner"
                    : choice === "custom"
                      ? "border-violet-200 bg-violet-50/20 shadow-inner"
                      : "border-zinc-200 bg-neutral-50/40 opacity-70"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-[10px] uppercase tracking-wider font-mono ${
                      choice === "custom" ? "text-violet-700" : "text-blue-700"
                    }`}>
                      {choice === "custom" ? "Phiên bản Tùy biến" : "Dữ liệu đề xuất Excel"}
                    </span>
                    {(choice === "excel" || choice === "custom") && (
                      <div className={`h-4.5 w-4.5 rounded-full text-white flex items-center justify-center ${
                        choice === "custom" ? "bg-violet-500" : "bg-blue-500"
                      }`}><Check size={10} strokeWidth={3} /></div>
                    )}
                  </div>
                  <div className="space-y-1 text-neutral-700 font-medium">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tên môn:</span>
                      <span className="font-semibold text-neutral-800">
                        {isCustom ? currentCustom?.courseName : conflict.excelRecord.courseName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tín chỉ:</span>
                      <span className="font-bold font-mono text-neutral-850">
                        {isCustom ? currentCustom?.credits : conflict.excelRecord.credits} tín chỉ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Khối kiến thức:</span>
                      <span className="font-semibold text-neutral-800">
                        {getKnowledgeBlockName(isCustom ? currentCustom?.knowledgeBlock : conflict.excelRecord.knowledgeBlock)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-zinc-150 relative z-10">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-550 text-xs font-bold transition cursor-pointer active:scale-98"
        >
          Hủy phiên
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-xl px-6 py-2.5 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-98 hover:shadow-emerald-600/30"
        >
          Xác nhận &amp; Tiếp tục
        </button>
      </div>
    </div>
  );
}
