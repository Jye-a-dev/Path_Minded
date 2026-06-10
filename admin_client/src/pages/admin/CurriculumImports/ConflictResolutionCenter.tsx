import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Edit } from "lucide-react";

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

interface CustomCourseEdit {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  knowledgeBlock: string;
}

interface ConflictResolutionCenterProps {
  conflicts: ConflictItem[];
  onResolve: (
    resolvedCourses: Record<string, "db" | "excel" | "custom">, 
    customEdits?: Record<string, CustomCourseEdit>
  ) => void;
  onCancel: () => void;
}

export const ConflictResolutionCenter: React.FC<ConflictResolutionCenterProps> = ({
  conflicts,
  onResolve,
  onCancel,
}) => {
  const [resolutions, setResolutions] = useState<Record<string, "db" | "excel" | "custom">>(() => {
    const initial: Record<string, "db" | "excel"> = {};
    conflicts.forEach(c => {
      initial[c.courseCode] = "excel"; // default is update new
    });
    return initial;
  });

  const [customEdits, setCustomEdits] = useState<Record<string, CustomCourseEdit>>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomCourseEdit | null>(null);

  const handleSelectResolution = (code: string, choice: "db" | "excel") => {
    setResolutions((prev) => ({ ...prev, [code]: choice }));
  };

  const handleStartCustomEdit = (conflict: ConflictItem) => {
    setEditingCode(conflict.courseCode);
    setEditForm({
      // Cho phép Admin đổi mã học phần để hỗ trợ Versioning song song
      courseCode: customEdits[conflict.courseCode]?.courseCode || conflict.excelRecord.courseCode,
      courseName: customEdits[conflict.courseCode]?.courseName || conflict.excelRecord.courseName,
      credits: customEdits[conflict.courseCode]?.credits ?? conflict.excelRecord.credits,
      theoryHours: customEdits[conflict.courseCode]?.theoryHours ?? conflict.excelRecord.theoryHours,
      practiceHours: customEdits[conflict.courseCode]?.practiceHours ?? conflict.excelRecord.practiceHours,
      knowledgeBlock: customEdits[conflict.courseCode]?.knowledgeBlock || conflict.excelRecord.knowledgeBlock,
    });
  };

  const handleSaveCustomEdit = () => {
    if (editingCode && editForm) {
      setCustomEdits((prev) => ({ ...prev, [editingCode]: editForm }));
      setResolutions((prev) => ({ ...prev, [editingCode]: "custom" }));
      setEditingCode(null);
      setEditForm(null);
    }
  };

  const handleConfirm = () => {
    onResolve(resolutions, customEdits);
  };

  return (
    <div className="space-y-6">
      {/* Alert Info Banner */}
      <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-4 flex gap-3">
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-bold text-rose-200 block">
            Phát hiện {conflicts.length} Xung đột Dữ liệu Học phần!
          </span>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Một số môn học có mã học phần trùng khớp với CSDL hiện có nhưng các cột thuộc tính (số tín chỉ, số tiết học, tên học phần) bị thay đổi. Vui lòng đối soát và lựa chọn phương án giải quyết cho từng môn học.
          </p>
          <p className="text-[10px] text-amber-400/80 mt-1.5 leading-relaxed">
            💡 <strong>Mẹo Gộp phiên bản (Versioning):</strong> Chọn <em>Tùy biến</em> và đổi Mã học phần thành <code>&lt;MÃ&gt;_V2</code> để lưu song song cả 2 phiên bản học phần trong cùng chương trình đào tạo.
          </p>
        </div>
      </div>

      {/* Main Reconciliation List */}
      <div className="space-y-6 max-h-125 overflow-y-auto pr-1">
        {conflicts.map((conflict) => {
          const choice = resolutions[conflict.courseCode];
          const isCustomEdited = choice === "custom";
          const currentCustom = customEdits[conflict.courseCode];

          return (
            <div
              key={conflict.courseCode}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 relative overflow-hidden"
              style={{
                borderColor: choice === "db" ? "rgba(16, 185, 129, 0.4)" : choice === "excel" ? "var(--primary-color)" : "rgba(167, 139, 250, 0.5)",
                boxShadow: choice === "db" ? "0 0 10px rgba(16, 185, 129, 0.05)" : choice === "excel" ? "0 0 10px rgba(79, 70, 229, 0.05)" : "0 0 10px rgba(167, 139, 250, 0.05)"
              }}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-950 border border-indigo-800 px-2 py-0.5 text-xs font-mono font-bold text-indigo-400">
                    {isCustomEdited && currentCustom?.courseCode && currentCustom.courseCode !== conflict.courseCode
                      ? <>{conflict.courseCode} <span className="text-violet-400">→ {currentCustom.courseCode}</span></>
                      : conflict.courseCode
                    }
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Đối soát học phần
                  </span>
                </div>

                {/* Resolution Pill Selector */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectResolution(conflict.courseCode, "db")}
                    className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer ${
                      choice === "db"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    Giữ cũ (Database)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectResolution(conflict.courseCode, "excel")}
                    className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer ${
                      choice === "excel"
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    style={choice === "excel" ? { backgroundColor: "var(--primary-color)" } : {}}
                  >
                    Ghi đè (Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCustomEdit(conflict)}
                    className={`rounded-md px-3 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                      isCustomEdited
                        ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 font-bold"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    <Edit size={12} />
                    {isCustomEdited ? "Đã sửa đổi" : "Tùy biến"}
                  </button>
                </div>
              </div>

              {/* Editing Form Panel */}
              {editingCode === conflict.courseCode && editForm && (
                <div className="p-4 rounded-xl border border-violet-800/40 bg-slate-950 space-y-3 animate-fadeIn">
                  <span className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                    <Edit size={11} className="text-violet-400" />
                    Chỉnh sửa thủ công / Gộp phiên bản (Versioning)
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {/* Mã học phần — cho phép đổi để versioning song song */}
                    <div className="col-span-2 space-y-1">
                      <label className="text-slate-400 flex items-center gap-1.5 flex-wrap">
                        Mã học phần:
                        <span className="text-violet-400/80 text-[10px]">(Đổi sang &lt;MÃ&gt;_V2 để lưu song song 2 phiên bản)</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.courseCode}
                        onChange={e => setEditForm({ ...editForm, courseCode: e.target.value.toUpperCase().trim() })}
                        placeholder={`${conflict.courseCode}_V2`}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-200 font-mono uppercase focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-slate-400">Tên môn học:</label>
                      <input
                        type="text"
                        value={editForm.courseName}
                        onChange={e => setEditForm({ ...editForm, courseName: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Số tín chỉ:</label>
                      <input
                        type="number"
                        value={editForm.credits ?? ""}
                        onChange={e => setEditForm({ ...editForm, credits: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Khối kiến thức:</label>
                      <select
                        value={editForm.knowledgeBlock}
                        onChange={e => setEditForm({ ...editForm, knowledgeBlock: e.target.value })}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 cursor-pointer focus:border-violet-500 focus:outline-none"
                      >
                        <option value="GENERAL">Đại cương</option>
                        <option value="SECTOR_CORE">Cơ sở khối ngành</option>
                        <option value="MAJOR_CORE">Cơ sở ngành</option>
                        <option value="SPECIALIZED">Chuyên ngành</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Giờ lý thuyết:</label>
                      <input
                        type="number"
                        value={editForm.theoryHours ?? ""}
                        onChange={e => setEditForm({ ...editForm, theoryHours: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">Giờ thực hành:</label>
                      <input
                        type="number"
                        value={editForm.practiceHours ?? ""}
                        onChange={e => setEditForm({ ...editForm, practiceHours: e.target.value ? Number(e.target.value) : null })}
                        className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-slate-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingCode(null); setEditForm(null); }}
                      className="rounded px-3 py-1 bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCustomEdit}
                      className="rounded px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              )}

              {/* Compare Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DB Version Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-slate-900 pb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">CSDL Hiện tại</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Tên môn:</span>{" "}
                      <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-rose-400" : "text-slate-300"}`}>
                        {conflict.dbRecord.course_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Số tín chỉ:</span>{" "}
                      <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-rose-400" : "text-slate-350"}`}>
                        {conflict.dbRecord.credits} tín chỉ
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Số tiết (LT/TH):</span>{" "}
                      <span className={`font-mono ${conflict.diffFields.includes("theoryHours") || conflict.diffFields.includes("practiceHours") ? "text-rose-400" : "text-slate-400"}`}>
                        {conflict.dbRecord.theory_hours ?? 0} tiết / {conflict.dbRecord.practice_hours ?? 0} tiết
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Khối kiến thức:</span>{" "}
                      <span className={`font-semibold ${conflict.diffFields.includes("knowledgeBlock") ? "text-rose-400" : "text-slate-350"}`}>
                        {conflict.dbRecord.knowledge_block === "GENERAL" ? "Đại cương" :
                         conflict.dbRecord.knowledge_block === "SECTOR_CORE" ? "Cơ sở khối ngành" :
                         conflict.dbRecord.knowledge_block === "MAJOR_CORE" ? "Cơ sở ngành" : "Chuyên ngành"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Excel/Proposed Version Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isCustomEdited ? "bg-violet-500" : "bg-indigo-500"}`}></span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isCustomEdited ? "text-violet-400" : "text-indigo-400"}`}>
                        {isCustomEdited ? "Tùy biến thủ công" : "Excel mới đề xuất"}
                      </span>
                    </div>
                    {isCustomEdited && (
                      <span className="text-[9px] bg-violet-950 border border-violet-800 text-violet-400 px-1 py-0.2 rounded font-bold uppercase">Sửa thủ công</span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    {isCustomEdited && currentCustom?.courseCode && currentCustom.courseCode !== conflict.courseCode && (
                      <div>
                        <span className="text-slate-500">Mã môn (mới):</span>{" "}
                        <span className="font-mono font-bold text-violet-400">{currentCustom.courseCode}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Tên môn:</span>{" "}
                      <span className={`font-semibold ${conflict.diffFields.includes("courseName") ? "text-emerald-400" : "text-slate-300"}`}>
                        {isCustomEdited ? currentCustom.courseName : conflict.excelRecord.courseName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Số tín chỉ:</span>{" "}
                      <span className={`font-mono font-bold ${conflict.diffFields.includes("credits") ? "text-emerald-400" : "text-slate-350"}`}>
                        {isCustomEdited ? currentCustom.credits : conflict.excelRecord.credits} tín chỉ
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Số tiết (LT/TH):</span>{" "}
                      <span className={`font-mono ${conflict.diffFields.includes("theoryHours") || conflict.diffFields.includes("practiceHours") ? "text-emerald-400" : "text-slate-400"}`}>
                        {isCustomEdited ? currentCustom.theoryHours : conflict.excelRecord.theoryHours ?? 0} tiết / {isCustomEdited ? currentCustom.practiceHours : conflict.excelRecord.practiceHours ?? 0} tiết
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Khối kiến thức:</span>{" "}
                      <span className={`font-semibold ${conflict.diffFields.includes("knowledgeBlock") ? "text-emerald-400" : "text-slate-350"}`}>
                        {(() => {
                          const val = isCustomEdited ? currentCustom.knowledgeBlock : conflict.excelRecord.knowledgeBlock;
                          return val === "GENERAL" ? "Đại cương" :
                                 val === "SECTOR_CORE" ? "Cơ sở khối ngành" :
                                 val === "MAJOR_CORE" ? "Cơ sở ngành" : "Chuyên ngành";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-550 px-5 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          <ShieldCheck size={14} />
          Xác nhận Hợp nhất dữ liệu
        </button>
      </div>
    </div>
  );
};