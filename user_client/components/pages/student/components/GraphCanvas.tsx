import React, { useRef } from "react";
import { Info, Lock, CheckCircle2, AlertTriangle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { CurriculumCourse, PrerequisiteRule } from "../simulator/components/types";

interface GraphCanvasProps {
  curriculum: CurriculumCourse[];
  layout: Record<string, { x: number; y: number }>;
  courseStatusMap: Map<string, "PASSED" | "STUDYING" | "FAILED" | "MISSING" | "LOCKED">;
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
  prereqs: PrerequisiteRule[];
}

export function GraphCanvas({
  curriculum,
  layout,
  courseStatusMap,
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
    <div className="flex-1 flex flex-col border border-zinc-200 bg-zinc-900 rounded-3xl overflow-hidden relative shadow-inner">
      {/* Instruction Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl text-neutral-300 text-xs border border-zinc-700/50">
        <Info size={13} className="text-violet-400" />
        <span>Kéo chuột để di chuyển bản đồ · Click chọn môn để xem ràng buộc</span>
      </div>

      {/* Toolbar Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-zinc-700/50">
        <button
          onClick={zoomIn}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          title="Phóng to"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={zoomOut}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          title="Thu nhỏ"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-px h-4 bg-zinc-700 mx-1" />
        <button
          onClick={resetZoom}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          title="Đặt lại"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Legend Indicator */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-3.5 bg-black/60 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-zinc-700/50 text-[10px] font-bold text-neutral-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Đã hoàn thành</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Đang học</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span>Trượt học phần</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
          <span>Khả dụng (Chưa học)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <span>Đang khóa (Prereqs chưa đạt)</span>
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
                  {/* Header bar */}
                  <rect
                    x={x}
                    y={10}
                    width={200}
                    height={28}
                    rx={6}
                    fill="#18181b"
                    stroke="#27272a"
                    strokeWidth={1}
                  />
                  <text
                    x={x + 100}
                    y={28}
                    textAnchor="middle"
                    fill="#a1a1aa"
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

              // Connection points
              const startX = startNode.x + 200; // Right side of source card
              const startY = startNode.y + 35;  // Middle Y of source card
              const endX = endNode.x;           // Left side of target card
              const endY = endNode.y + 35;      // Middle Y of target card

              // Determine highlight coloring
              let strokeColor = "#3f3f46"; // Default gray connection
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
                  opacity={selectedCourseCode && !isHighlighted ? 0.25 : 0.85}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Render Course Node Cards */}
            {curriculum.map((c) => {
              const pos = layout[c.course_code];
              if (!pos) return null;

              const status = courseStatusMap.get(c.course_code) || "MISSING";
              const isSelected = selectedCourseCode === c.course_code;

              // Styling logic based on academic warnings / status
              let cardBg = "rgba(39, 39, 42, 0.4)";
              let cardBorder = "#3f3f46";
              let badgeText = "Chưa học";
              let textTitle = "text-neutral-300";
              let iconNode = null;

              if (status === "PASSED") {
                cardBg = "rgba(16, 185, 129, 0.08)";
                cardBorder = "#10b981";
                badgeText = "Đã hoàn thành";
                iconNode = <CheckCircle2 size={13} className="text-emerald-500" />;
              } else if (status === "STUDYING") {
                cardBg = "rgba(245, 158, 11, 0.08)";
                cardBorder = "#f59e0b";
                badgeText = "Đang học";
                iconNode = <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />;
              } else if (status === "FAILED") {
                cardBg = "rgba(239, 68, 68, 0.12)";
                cardBorder = "#ef4444";
                badgeText = "Đã trượt học phần";
                iconNode = <AlertTriangle size={13} className="text-red-500" />;
              } else if (status === "LOCKED") {
                cardBg = "rgba(24, 24, 27, 0.8)";
                cardBorder = "#27272a";
                badgeText = "Đang khóa";
                textTitle = "text-neutral-500";
                iconNode = <Lock size={12} className="text-neutral-600" />;
              }

              // If path highlighted
              let highlightRing = "";
              let cardOpacity = 1;
              if (selectedCourseCode) {
                if (isSelected) {
                  highlightRing = "ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-900";
                  cardBorder = "#8b5cf6";
                } else if (dependencyPaths.ancestors.has(c.course_code)) {
                  highlightRing = "ring-2 ring-blue-500/80 ring-offset-1 ring-offset-zinc-900";
                  cardBorder = "#3b82f6";
                } else if (dependencyPaths.descendants.has(c.course_code)) {
                  highlightRing = "ring-2 ring-orange-500/80 ring-offset-1 ring-offset-zinc-900";
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
                    className={`h-full border rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-sm hover:scale-[1.02] backdrop-blur-sm select-none ${highlightRing}`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[10px] font-black font-mono tracking-wide text-neutral-400">
                        {c.course_code}
                      </span>
                      <div className="flex items-center gap-1.5">{iconNode}</div>
                    </div>

                    <p
                      className={`text-xs font-semibold leading-snug truncate ${textTitle}`}
                      title={c.course_name}
                    >
                      {c.course_name}
                    </p>

                    <div className="flex items-center justify-between text-[9px] font-bold text-neutral-500">
                      <span>{c.credits} tín chỉ</span>
                      <span style={{ color: cardBorder }}>{badgeText}</span>
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
