import React, { useRef } from "react";
import { Info, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
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
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  maxSem: number;
  colWidth: number;
  setZoom?: React.Dispatch<React.SetStateAction<number>>;
}

const CARD_W = 200;
const CARD_H = 80;

/** Truncate a string to fit approximately maxChars characters */
function truncate(str: string, maxChars: number) {
  if (!str) return "";
  return str.length > maxChars ? str.slice(0, maxChars - 1) + "…" : str;
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
  isExpanded = false,
  onToggleExpand,
  maxSem,
  colWidth,
  setZoom,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const getBezierPath = (sx: number, sy: number, ex: number, ey: number) => {
    const o = 80;
    return `M ${sx} ${sy} C ${sx + o} ${sy}, ${ex - o} ${ey}, ${ex} ${ey}`;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!setZoom) return;
    e.preventDefault();
    const d = e.deltaY > 0 ? -1 : 1;
    setZoom((prev) => Math.min(Math.max(prev + d * 0.05, 0.4), 1.5));
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
        <button type="button" onClick={zoomIn} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Phóng to">
          <ZoomIn size={16} />
        </button>
        <button type="button" onClick={zoomOut} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Thu nhỏ">
          <ZoomOut size={16} />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <button type="button" onClick={resetZoom} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title="Đặt lại">
          <RotateCcw size={16} />
        </button>
        {onToggleExpand && (
          <>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <button type="button" onClick={onToggleExpand} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" title={isExpanded ? "Thu nhỏ" : "Toàn màn hình"}>
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 lg:right-auto z-10 flex flex-wrap gap-3.5 bg-slate-900/85 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-300">
        {[
          { color: "#6366f1", label: "Bắt buộc" },
          { color: "#f59e0b", label: "Tự chọn" },
          { color: "#3b82f6", label: "Thể chất" },
          { color: "#10b981", label: "Tiếng Anh" },
          { color: "#ec4899", label: "Quốc phòng" },
          { color: "#64748b", label: "Khác" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <svg className="w-full h-full">
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Semester column headers */}
            {Array.from({ length: maxSem }).map((_, i) => {
              const x = 50 + i * colWidth;
              return (
                <g key={i}>
                  <rect x={x} y={10} width={CARD_W} height={28} rx={6} fill="#0f172a" stroke="#1e293b" strokeWidth={1} />
                  <text x={x + CARD_W / 2} y={28} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="bold">
                    HỌC KỲ {i + 1}
                  </text>
                </g>
              );
            })}

            {/* Edge paths */}
            {prereqs.map((rule, idx) => {
              const sn = layout[rule.prerequisite_course_code];
              const en = layout[rule.course_code];
              if (!sn || !en) return null;
              let stroke = "#334155";
              let sw = 1.2;
              let highlighted = false;
              if (selectedCourseCode) {
                const srcSel = rule.prerequisite_course_code === selectedCourseCode;
                const tgtSel = rule.course_code === selectedCourseCode;
                if (srcSel && dependencyPaths.descendants.has(rule.course_code)) {
                  stroke = "#f97316"; sw = 2.5; highlighted = true;
                } else if (tgtSel && dependencyPaths.ancestors.has(rule.prerequisite_course_code)) {
                  stroke = "#3b82f6"; sw = 2.5; highlighted = true;
                }
              }
              return (
                <path
                  key={idx}
                  d={getBezierPath(sn.x + CARD_W, sn.y + CARD_H / 2, en.x, en.y + CARD_H / 2)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={sw}
                  opacity={selectedCourseCode && !highlighted ? 0.2 : 0.85}
                />
              );
            })}

            {/* Course node cards — pure SVG, no foreignObject */}
            {curriculum.map((c) => {
              const pos = layout[c.course_code];
              if (!pos) return null;

              const isSelected = selectedCourseCode === c.course_code;

              // Colors by type
              let fillColor = "rgba(15,23,42,0.8)";
              let strokeColor = "#1e293b";
              let typeLabel = "Khác";
              let accentColor = "#64748b";

              if (c.course_type === "REQUIRED")  { fillColor = "rgba(99,102,241,0.12)"; strokeColor = "#6366f1"; typeLabel = "Bắt buộc"; accentColor = "#818cf8"; }
              else if (c.course_type === "ELECTIVE") { fillColor = "rgba(245,158,11,0.12)"; strokeColor = "#f59e0b"; typeLabel = "Tự chọn"; accentColor = "#fbbf24"; }
              else if (c.course_type === "PE")     { fillColor = "rgba(59,130,246,0.12)"; strokeColor = "#3b82f6"; typeLabel = "Thể chất"; accentColor = "#60a5fa"; }
              else if (c.course_type === "ENGLISH") { fillColor = "rgba(16,185,129,0.12)"; strokeColor = "#10b981"; typeLabel = "Tiếng Anh"; accentColor = "#34d399"; }
              else if (c.course_type === "DEFENSE") { fillColor = "rgba(236,72,153,0.12)"; strokeColor = "#ec4899"; typeLabel = "Quốc phòng"; accentColor = "#f472b6"; }

              let cardOpacity = 1;
              let glowStroke = strokeColor;
              let glowWidth = 1;

              if (selectedCourseCode) {
                if (isSelected) {
                  glowStroke = "#a78bfa"; glowWidth = 2.5;
                } else if (dependencyPaths.ancestors.has(c.course_code)) {
                  glowStroke = "#3b82f6"; glowWidth = 2;
                } else if (dependencyPaths.descendants.has(c.course_code)) {
                  glowStroke = "#f97316"; glowWidth = 2;
                } else {
                  cardOpacity = 0.3;
                }
              }

              const { x, y } = pos;
              const courseName = truncate(c.course_name || c.course_code, 26);
              const courseCode = truncate(c.course_code, 14);

              return (
                <g
                  key={c.course_code}
                  opacity={cardOpacity}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCourseCode(isSelected ? null : c.course_code);
                  }}
                >
                  {/* Card background */}
                  <rect
                    x={x} y={y}
                    width={CARD_W} height={CARD_H}
                    rx={12}
                    fill={fillColor}
                    stroke={glowStroke}
                    strokeWidth={glowWidth}
                  />

                  {/* Top divider line */}
                  <line x1={x + 10} y1={y + 22} x2={x + CARD_W - 10} y2={y + 22} stroke={strokeColor} strokeWidth={0.5} opacity={0.4} />

                  {/* Course code */}
                  <text
                    x={x + 10} y={y + 15}
                    fill="#94a3b8"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    letterSpacing="0.5"
                  >
                    {courseCode}
                  </text>

                  {/* Type badge (right) */}
                  <rect x={x + CARD_W - 52} y={y + 5} width={46} height={13} rx={4} fill="rgba(30,41,59,0.9)" />
                  <text x={x + CARD_W - 29} y={y + 14.5} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                    {typeLabel}
                  </text>

                  {/* Course name — the middle section, bright white */}
                  <text
                    x={x + 10} y={y + 38}
                    fill="#f1f5f9"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {courseName}
                  </text>

                  {/* Bottom: credits */}
                  <text x={x + 10} y={y + 68} fill="#64748b" fontSize="9" fontWeight="bold">
                    {c.credits} tín chỉ
                  </text>

                  {/* Bottom: semester (right, accent color) */}
                  <text x={x + CARD_W - 10} y={y + 68} textAnchor="end" fill={accentColor} fontSize="9" fontWeight="bold">
                    Học kỳ {c.expected_semester}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
