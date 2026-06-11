"use client";

import React from "react";
import { ArrowLeft, Building2, Loader2, Download } from "lucide-react";
import { ClassItem } from "../index";
import { MatrixPreviewData } from "./OnlineMatrixTable";

interface MatrixHeaderProps {
  setViewMatrix: React.Dispatch<React.SetStateAction<boolean>>;
  classes: ClassItem[];
  selectedClassId: string;
  matrixData: MatrixPreviewData | null;
  stats: { passed: number; studying: number; failed: number; total: number } | null;
  handleDownloadExcel: (classId: string, classCode: string) => Promise<void>;
  downloadingId: string | null;
  matrixLoading: boolean;
}

export default function MatrixHeader({
  setViewMatrix,
  classes,
  selectedClassId,
  matrixData,
  stats,
  handleDownloadExcel,
  downloadingId,
  matrixLoading,
}: MatrixHeaderProps) {
  const currentClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setViewMatrix(false)}
          className="p-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-neutral-50 text-neutral-700 transition cursor-pointer"
          title="Quay lại"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 tracking-tight flex items-center gap-1.5">
            <Building2 size={16} className="text-emerald-600" />
            Lớp: {currentClass?.class_code || "N/A"}
          </h2>
          {matrixData && (
            <p className="text-xs text-neutral-400 font-bold mt-0.5 font-mono">
              Chương trình: {matrixData.programInfo.program_code} · {matrixData.programInfo.program_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {stats && (
          <div className="flex items-center gap-2 bg-neutral-50 border border-zinc-200 rounded-xl p-1.5 text-[10px] font-bold">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
              Đạt: {stats.passed}
            </span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
              Học: {stats.studying}
            </span>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg">
              Rớt: {stats.failed}
            </span>
          </div>
        )}

        {selectedClassId && (
          <button
            onClick={() => {
              if (currentClass) {
                void handleDownloadExcel(selectedClassId, currentClass.class_code);
              }
            }}
            disabled={downloadingId === selectedClassId || matrixLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {downloadingId === selectedClassId ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Đang kết xuất...
              </>
            ) : (
              <>
                <Download size={12} />
                Tải Excel
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
