import React, { useRef } from "react";
import { Info, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { CourseItem } from "../../../hooks/useCurriculumCourses";
import type { PrerequisiteItem } from "../../../hooks/useCoursePrerequisites";

interface GraphCanvasProps {
  curriculum: CourseItem[];
  layout: Record<string, { x: number; y: number }>;
  selectedCourseCode: string | null;
  setSelectedCourseCode: (code: string | null) => void;
  dependencyPaths: { ancestors: Set<string>; descendants: Set<string> };
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  prereqs: PrerequisiteItem[];
}

export function GraphCanvas({
  curriculum,
  layout,
  selectedCourseCode,
  setSelectedCourseCode,
  dependencyPaths,
  zoom,
  pan,
  isDragging,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  zoomIn,
  zoomOut,
  resetZoom,
  prereqs,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute curved path between nodes
  const getBezierPath = (startX: number, startY: number, endX: number, endY: number) => {
    const controlOffset = 80;
    return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div className="flex-1 flex flex-col border border-slate-800 bg-slate-950 rounded-3xl overflow-hidden relative shadow-inner">
      {/* Instruction Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl text-slate-300 text-xs border border-slate-800">
        <Info size={13} className="text-indigo-400" />
        <span>Kéo chuột để di chuyển bản đồ · Click chọn môn để xem điều kiện tiên quyết</span>
      </div>

      {/* Toolbar Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={zoomIn}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Phóng to"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Thu nhỏ"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <button
          type="button"
          onClick={resetZoom}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Đặt lại"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Legend Indicator */}
      <div className="absolute bottom-4 left-4 right-4 lg:right-auto z-10 flex flex-wrap gap-3.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Bắt buộc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Tự chọn</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Thể chất</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Tiếng Anh</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
          <span>Quốc phòng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Khác</span>
        </div>
      </div>

      {/* Dynamic Interactive SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <svg className="w-full h-full">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Semester Columns Labels */}
            {Array.from({ length: 8 }).map((_, index) => {
              const x = 50 + index * 260;
              return (
                <g key={index}>
                  <rect
                    x={x}
                    y={10}
                    width={200}
                    height={28}
                    rx={6}
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth={1}
                  />
                  <text
                    x={x + 100}
                    y={28}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11px"
                    fontWeight="bold"
                  >
                    HỌC KỲ {index + 1}
                  </text>
                </g>
              );
            })}

            {/* Edge Connections Paths */}
            {prereqs.map((rule, idx) => {
              const startNode = layout[rule.prerequisite_course_code];
              const endNode = layout[rule.course_code];
              if (!startNode || !endNode) return null;

              const startX = startNode.x + 200; // Right side of source card
              const startY = startNode.y + 36;  // Middle Y of source card
              const endX = endNode.x;           // Left side of target card
              const endY = endNode.y + 36;      // Middle Y of target card

              let strokeColor = "#334155"; // Default dark slate connection
              let strokeWidth = 1.2;
              let isHighlighted = false;

              if (selectedCourseCode) {
                const isSourceSelected = rule.prerequisite_course_code === selectedCourseCode;
                const isTargetSelected = rule.course_code === selectedCourseCode;

                if (isSourceSelected && dependencyPaths.descendants.has(rule.course_code)) {
                  strokeColor = "#f97316"; // Descendant link path: Orange
                  strokeWidth = 2.5;
                  isHighlighted = true;
                } else if (isTargetSelected && dependencyPaths.ancestors.has(rule.prerequisite_course_code)) {
                  strokeColor = "#3b82f6"; // Prerequisite link path: Blue
                  strokeWidth = 2.5;
                  isHighlighted = true;
                }
              }

              return (
                <path
                  key={idx}
                  d={getBezierPath(startX, startY, endX, endY)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity={selectedCourseCode && !isHighlighted ? 0.2 : 0.85}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Render Course Node Cards */}
            {curriculum.map((c) => {
              const pos = layout[c.course_code];
              if (!pos) return null;

              const isSelected = selectedCourseCode === c.course_code;

              // Color node card by course type
              let cardBg = "rgba(15, 23, 42, 0.6)";
              let cardBorder = "#1e293b";
              let textType = "Khác";

              if (c.course_type === "REQUIRED") {
                cardBg = "rgba(99, 102, 241, 0.05)";
                cardBorder = "#6366f1";
                textType = "Bắt buộc";
              } else if (c.course_type === "ELECTIVE") {
                cardBg = "rgba(245, 158, 11, 0.05)";
                cardBorder = "#f59e0b";
                textType = "Tự chọn";
              } else if (c.course_type === "PE") {
                cardBg = "rgba(59, 130, 246, 0.05)";
                cardBorder = "#3b82f6";
                textType = "Thể chất";
              } else if (c.course_type === "ENGLISH") {
                cardBg = "rgba(16, 185, 129, 0.05)";
                cardBorder = "#10b981";
                textType = "Tiếng Anh";
              } else if (c.course_type === "DEFENSE") {
                cardBg = "rgba(236, 72, 153, 0.05)";
                cardBorder = "#ec4899";
                textType = "Quốc phòng";
              }

              // If path highlighted
              let highlightRing = "";
              let cardOpacity = 1;
              if (selectedCourseCode) {
                if (isSelected) {
                  highlightRing = "ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950";
                  cardBorder = "#a78bfa";
                } else if (dependencyPaths.ancestors.has(c.course_code)) {
                  highlightRing = "ring-2 ring-blue-500/80 ring-offset-1 ring-offset-slate-950";
                  cardBorder = "#3b82f6";
                } else if (dependencyPaths.descendants.has(c.course_code)) {
                  highlightRing = "ring-2 ring-orange-500/80 ring-offset-1 ring-offset-slate-950";
                  cardBorder = "#f97316";
                } else {
                  cardOpacity = 0.35; // Dim non-involved courses
                }
              }

              return (
                <foreignObject
                  key={c.course_code}
                  x={pos.x}
                  y={pos.y}
                  width={200}
                  height={72}
                  className="overflow-visible"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCourseCode(isSelected ? null : c.course_code);
                    }}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      opacity: cardOpacity,
                    }}
                    className={`h-full border rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-md hover:scale-[1.02] backdrop-blur-sm select-none text-slate-200 ${highlightRing}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[10px] font-black font-mono tracking-wide text-slate-400">
                        {c.course_code}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800/85 text-slate-400">
                        {textType}
                      </span>
                    </div>

                    <p
                      className="text-xs font-bold leading-snug truncate text-slate-200"
                      title={c.course_name}
                    >
                      {c.course_name}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                      <span>{c.credits} tín chỉ</span>
                      <span className="opacity-80" style={{ color: cardBorder }}>
                        Học kỳ {c.expected_semester}
                      </span>
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
