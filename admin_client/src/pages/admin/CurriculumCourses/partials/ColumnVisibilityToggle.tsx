import { useState, useRef, useEffect } from "react";
import { Eye } from "lucide-react";

interface ColumnVisibilityToggleProps {
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
}

const allToggleableColumns = [
  { key: "course_code", label: "Mã môn" },
  { key: "course_name", label: "Tên môn học" },
  { key: "credits", label: "Số tín chỉ" },
  { key: "theory_hours", label: "LT" },
  { key: "practice_hours", label: "TH" },
  { key: "project_hours", label: "ĐA" },
  { key: "internship_hours", label: "TT" },
  { key: "course_type", label: "Loại môn" },
  { key: "prerequisite", label: "ĐK tiên quyết" },
  { key: "corequisite", label: "Học trước" },
  { key: "organizing_semester", label: "HK tổ chức" },
  { key: "expected_semester", label: "Học kỳ" },
  { key: "expected_year", label: "Năm thứ" },
  { key: "is_required", label: "Yêu cầu" },
  { key: "knowledge_block", label: "Khối kiến thức" },
];

export function ColumnVisibilityToggle({
  visibleColumns,
  onChange,
}: ColumnVisibilityToggleProps) {
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowColumnToggle(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setShowColumnToggle(!showColumnToggle)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-955/60 px-3.5 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer"
      >
        <Eye size={16} />
        Ẩn/Hiện Cột
      </button>
      {showColumnToggle && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-955 p-2.5 shadow-xl z-50 max-h-80 overflow-y-auto space-y-1.5 backdrop-blur-md">
          <div className="text-[10px] font-bold text-slate-500 px-1.5 pb-1 border-b border-slate-800 uppercase tracking-wider">
            Hiển thị cột
          </div>
          {allToggleableColumns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-800/60 rounded text-xs text-slate-300 cursor-pointer font-medium select-none"
            >
              <input
                type="checkbox"
                checked={visibleColumns.includes(col.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...visibleColumns, col.key]);
                  } else {
                    if (visibleColumns.length > 2) {
                      onChange(visibleColumns.filter((k) => k !== col.key));
                    }
                  }
                }}
                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
