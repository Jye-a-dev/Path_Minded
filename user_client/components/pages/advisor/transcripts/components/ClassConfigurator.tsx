import React from "react";
import { GraduationCap, Loader2 } from "lucide-react";

export interface ClassItem {
  id: string;
  class_code: string;
  class_name: string | null;
  advisor_id: string | null;
  program_id: string | null;
}

interface ClassConfiguratorProps {
  classes: ClassItem[];
  selectedClassId: string;
  setSelectedClassId: (id: string) => void;
  loadingStudents: boolean;
  onConfirmConfig: () => void;
}

export default function ClassConfigurator({
  classes,
  selectedClassId,
  setSelectedClassId,
  loadingStudents,
  onConfirmConfig
}: ClassConfiguratorProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto py-12 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center space-y-2 relative z-10">
        <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
          Quản lý Điểm &amp; Bảng điểm
        </h1>
        <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Chọn lớp học do bạn cố vấn học tập để hiển thị danh sách quản lý sinh viên.
        </p>
      </div>

      <div className="relative rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl space-y-6 z-10 transition-all hover:shadow-2xl hover:border-emerald-250">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">Lớp học phụ trách</label>
            {classes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-300 text-center text-xs text-neutral-400 italic">
                Không tìm thấy lớp học nào thuộc quyền quản lý của bạn.
              </div>
            ) : (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer hover:border-zinc-300"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_code} {cls.class_name ? `(${cls.class_name})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <button
          onClick={onConfirmConfig}
          disabled={!selectedClassId || loadingStudents}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-55 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {loadingStudents && <Loader2 size={16} className="animate-spin text-white" />}
          Xác nhận cấu hình
        </button>
      </div>
    </div>
  );
}
