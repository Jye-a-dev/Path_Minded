"use client";

import React from "react";
import { TableProperties, ArrowRight } from "lucide-react";
import { ClassItem } from "../index";

interface ClassSelectorCardProps {
  selectedClassId: string;
  setSelectedClassId: React.Dispatch<React.SetStateAction<string>>;
  classes: ClassItem[];
  currentAdvisorName?: string;
  onAccessMatrix: () => void;
}

export default function ClassSelectorCard({
  selectedClassId,
  setSelectedClassId,
  classes,
  currentAdvisorName,
  onAccessMatrix,
}: ClassSelectorCardProps) {
  return (
    <div className="flex items-center justify-center py-12 px-4 min-h-[50vh] relative z-10">
      <div className="max-w-md w-full space-y-6 p-8 rounded-2xl border border-zinc-200 bg-white shadow-xl relative overflow-hidden transition-all duration-300 hover:border-emerald-200 hover:shadow-2xl">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center relative z-10">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-emerald-500 to-emerald-650 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <TableProperties className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-neutral-900 tracking-tight">Ma trận kiểm định học tập</h2>
          <p className="mt-2 text-xs text-neutral-500 leading-relaxed">
            Vui lòng chọn lớp học do bạn cố vấn để bắt đầu đối soát, cập nhật điểm số và kết xuất ma trận học tập trực tuyến.
          </p>
        </div>

        <div className="mt-6 space-y-4 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              Lớp học phụ trách (Class)
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-neutral-55 px-4 py-3 text-sm font-semibold text-neutral-800 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all cursor-pointer hover:border-zinc-300"
            >
              {classes.length === 0 ? (
                <option value="">Không có lớp phụ trách</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_code} {cls.class_name ? `(${cls.class_name})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedClassId && (
            <div className="space-y-1.5 bg-neutral-50 p-4 rounded-xl border border-zinc-200">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Cố vấn học tập (CVHT)
              </span>
              <span className="text-sm font-extrabold text-neutral-800 block">
                {currentAdvisorName || "Chưa xác định"}
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={!selectedClassId}
            onClick={onAccessMatrix}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-5 py-3.5 text-sm font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 active:scale-98 cursor-pointer"
          >
            Truy cập Ma trận học tập
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
