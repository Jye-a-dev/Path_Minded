import React, { useState, useEffect } from "react";
import { AlertTriangle, Edit2 } from "lucide-react";

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
}

export default function ConflictResolutionPhase({
  conflicts,
  previewCourses,
  onCancel,
  onConfirm
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner warning */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex gap-3.5">
        <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-bold text-rose-800 block">
            Phát hiện {conflicts.length} Xung đột Dữ liệu Học phần!
          </span>
          <p className="text-xs text-rose-650 mt-1 leading-relaxed">
            Các môn học bên dưới đã có sẵn trong CSDL chương trình học, nhưng các thuộc tính (tên, tín chỉ, giờ lý thuyết...) bị thay đổi trong tệp Excel. Vui lòng đối soát.
          </p>
          <p className="text-[10px] text-amber-600 mt-1.5 font-semibold">
            💡 Gợi ý gộp phiên bản (Versioning): Đổi Mã học phần sang dạng `MÃ_V2` trong Tùy biến để lưu song song cả hai phiên bản.
          </p>
        </div>
      </div>

      {/* List of conflicts */}
      <div className="space-y-6">
        {conflicts.map((conflict) => {
          const choice = resolutions[conflict.courseCode] || "excel";
          const isCustom = choice === "custom";
          const currentCustom = customEdits[conflict.courseCode];

          return (
            <div
              key={conflict.courseCode}
              className="rounded-2xl border bg-white p-5 space-y-4 shadow-sm transition-all duration-300"
              style={{
                borderColor:
                  choice === "db"
                    ? "#10b981"
                    : choice === "excel"
                      ? "#10b981"
                      : "#8b5cf6"
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-150 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
                    {isCustom && currentCustom?.courseCode && currentCustom.courseCode !== conflict.courseCode ? (
                      <>
                        {conflict.courseCode} <span className="text-violet-600">→ {currentCustom.courseCode}</span>
                      </>
                    ) : (
                      conflict.courseCode
                    )}
                  </span>
                  <span className="text-xs font-bold text-neutral-800">Đối soát thuộc tính</span>
                </div>

                {/* Radio Options */}
                <div className="flex items-center gap-2 bg-neutral-50 p-1 rounded-xl border border-zinc-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "db" }))}
                    className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                      choice === "db"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    Giữ cũ (DB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutions((prev) => ({ ...prev, [conflict.courseCode]: "excel" }))}
                    className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                      choice === "excel"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    Ghi đè (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCustomEdit(conflict)}
                    className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                      isCustom
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <Edit2 size={11} />
                    {isCustom ? "Đã sửa đổi" : "Tùy biến"}
                  </button>
                </div>
              </div>

              {/* Editing custom panel */}
              {editingConflictCode === conflict.courseCode && conflictEditForm && (
                <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/30 space-y-3">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <Edit2 size={12} className="text-violet-600" />
                    Chỉnh sửa / Đổi phiên bản (Versioning)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-neutral-500 flex items-center gap-1 flex-wrap">
                        Mã học phần:
                        <span className="text-violet-600 text-[10px]">(Ví dụ: {conflict.courseCode}_V2)</span>
                      </label>
                      <input
                        type="text"
                        value={conflictEditForm.courseCode}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseCode: e.target.value.toUpperCase().trim() })}
                        className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800 font-mono uppercase"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-neutral-500">Tên học phần:</label>
                      <input
                        type="text"
                        value={conflictEditForm.courseName}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, courseName: e.target.value })}
                        className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-neutral-500">Số tín chỉ:</label>
                      <input
                        type="number"
                        value={conflictEditForm.credits ?? ""}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, credits: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-neutral-500">Khối kiến thức:</label>
                      <select
                        value={conflictEditForm.knowledgeBlock}
                        onChange={(e) => setConflictEditForm({ ...conflictEditForm, knowledgeBlock: e.target.value })}
                        className="w-full rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-neutral-850 cursor-pointer"
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
                      className="rounded-lg px-3 py-1 bg-zinc-250 text-neutral-600 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomEdit}
                      className="rounded-lg px-3 py-1 bg-violet-600 hover:bg-violet-55 text-white text-xs font-bold cursor-pointer"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              {/* Comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DB Version */}
                <div className="p-3 border border-zinc-150 rounded-xl bg-neutral-50/50 space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">Trong CSDL</p>
                  <div>
                    <span className="text-neutral-450">Tên môn:</span>{" "}
                    <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-rose-600" : "text-neutral-800"}`}>
                      {conflict.dbRecord.course_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-455">Số tín chỉ:</span>{" "}
                    <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-rose-600" : "text-neutral-850"}`}>
                      {conflict.dbRecord.credits} tín chỉ
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-455">Khối kiến thức:</span>{" "}
                    <span className="font-medium text-neutral-750">
                      {conflict.dbRecord.knowledge_block}
                    </span>
                  </div>
                </div>

                {/* Excel Version */}
                <div className="p-3 border border-zinc-150 rounded-xl bg-neutral-50/50 space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-700 text-[10px] uppercase tracking-wider">
                    {isCustom ? "Phiên bản Tùy biến" : "Đề xuất Excel"}
                  </p>
                  <div>
                    <span className="text-neutral-455">Tên môn:</span>{" "}
                    <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-emerald-700" : "text-neutral-800"}`}>
                      {isCustom ? currentCustom?.courseName : conflict.excelRecord.courseName}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-455">Số tín chỉ:</span>{" "}
                    <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-emerald-700" : "text-neutral-850"}`}>
                      {isCustom ? currentCustom?.credits : conflict.excelRecord.credits} tín chỉ
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-455">Khối kiến thức:</span>{" "}
                    <span className="font-medium text-neutral-750">
                      {isCustom ? currentCustom?.knowledgeBlock : conflict.excelRecord.knowledgeBlock}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-500 text-xs font-bold transition cursor-pointer"
        >
          Hủy phiên
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/10"
        >
          Xác nhận &amp; Tiếp tục
        </button>
      </div>
    </div>
  );
}
