import React from "react";
import type { MatrixPreviewData } from "../types";

interface MatrixInfoLegendProps {
  matrixData: MatrixPreviewData;
}

export const MatrixInfoLegend: React.FC<MatrixInfoLegendProps> = ({ matrixData }) => {
  return (
    <div className="flex justify-between items-stretch gap-4" style={{ height: "115px", fontFamily: "inherit", color: "#000" }}>
      {/* Col 1: Class Info */}
      <div className="flex-1 flex flex-col justify-center border-r border-slate-200 pr-4">
        <div style={{ fontWeight: "900", fontSize: "14px", color: "#000", textTransform: "uppercase", letterSpacing: "-0.3px" }}>
          Tên CTDT - KHOÁ
        </div>
        <div style={{ fontWeight: "800", fontSize: "11.5px", color: "#000", marginTop: 3 }}>
          Lớp: {matrixData.classInfo.class_name || matrixData.classInfo.class_code}
        </div>
        <div className="text-[9.5px] text-black mt-2 space-y-0.5" style={{ lineHeight: 1.25 }}>
          <div><b>Mã lớp:</b> {matrixData.classInfo.class_code}</div>
          <div><b>Niên khóa:</b> {matrixData.classInfo.cohort_year ?? "—"}</div>
        </div>
      </div>

      {/* Col 2: Legend Table */}
      <div className="flex-1 flex flex-col justify-center border-r border-slate-200 pr-4 text-[8.5px] text-black select-none">
        <div className="font-bold text-black mb-1 uppercase tracking-wider text-[8px]">Tốt nghiệp</div>
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded bg-[#fff59d] border border-amber-400"></span>
            <span className="font-semibold text-black">Đúng hạn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded bg-[#ff8a80] border border-rose-400"></span>
            <span className="font-semibold text-black">Nguy cơ trễ hạn</span>
          </div>
        </div>
        <div className="font-bold text-black mt-2 mb-1 uppercase tracking-wider text-[8px]">Môn học</div>
        <div className="grid grid-cols-3 gap-1">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-white border border-slate-350 rounded font-bold text-black text-[8px]">x</span>
            <span className="text-black font-semibold">Đạt</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-rose-400 rounded font-bold text-black text-[8px]">o</span>
            <span className="text-black font-semibold">Rớt</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-amber-400 rounded font-bold text-black text-[8px]">1</span>
            <span className="text-black font-semibold">Học</span>
          </div>
        </div>
      </div>

      {/* Col 3: Plan Info */}
      <div style={{ width: "120px" }} className="flex flex-col justify-center pl-2">
        <div style={{ fontWeight: "800", fontSize: "10.5px", color: "#000" }}>
          Kế hoạch học tập
        </div>
        <div style={{ fontSize: "16px", fontWeight: "900", color: "#000", marginTop: 2 }}>
          {matrixData.programInfo.total_credits ?? "—"} <span className="text-[10px] font-bold text-black">Tín chỉ</span>
        </div>
        <div className="text-[9.5px] text-black mt-1" style={{ lineHeight: 1.25 }}>
          <div><b>Mã CT:</b> {matrixData.programInfo.program_code}</div>
          <div className="truncate" title={matrixData.programInfo.major_name || ""}><b>Ngành:</b> {matrixData.programInfo.major_name || "—"}</div>
        </div>
      </div>
    </div>
  );
};
