import { useState, useRef } from "react";
import { useCourseTypeMappings } from "../../../hooks/useCourseTypeMappings";
import type { CourseTypeMappingItem, CourseTypeKey } from "../../../hooks/useCourseTypeMappings";
import { Tags, RefreshCw, Plus, X, AlertTriangle } from "lucide-react";

// ─── Color config per course_type ─────────────────────────────────────────────
const TYPE_CONFIG: Record<
  CourseTypeKey,
  { label: string; color: string; badge: string; border: string; icon: string; desc: string }
> = {
  REQUIRED: {
    label: "Bắt buộc",
    color: "text-indigo-400",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    icon: "🔒",
    desc: "Môn học bắt buộc trong chương trình đào tạo",
  },
  ELECTIVE: {
    label: "Tự chọn",
    color: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    icon: "🎯",
    desc: "Môn học sinh viên được phép lựa chọn",
  },
  PE: {
    label: "Giáo dục thể chất",
    color: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    border: "border-orange-500/20 hover:border-orange-500/40",
    icon: "🏃",
    desc: "Môn Giáo dục thể chất / Thể dục thể thao",
  },
  ENGLISH: {
    label: "Tiếng Anh",
    color: "text-sky-400",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    border: "border-sky-500/20 hover:border-sky-500/40",
    icon: "🌐",
    desc: "Các môn ngoại ngữ, tiếng Anh",
  },
  DEFENSE: {
    label: "Giáo dục quốc phòng",
    color: "text-rose-400",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    border: "border-rose-500/20 hover:border-rose-500/40",
    icon: "🛡️",
    desc: "Môn Giáo dục quốc phòng – An ninh",
  },
  OTHER: {
    label: "Khác",
    color: "text-slate-400",
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    border: "border-slate-500/20 hover:border-slate-500/40",
    icon: "📦",
    desc: "Các loại môn học không thuộc nhóm trên",
  },
};

// ─── Single Card Component ─────────────────────────────────────────────────────
function CourseTypeCard({
  item,
  onUpdate,
}: {
  item: CourseTypeMappingItem;
  onUpdate: (id: string, payload: { phrases?: string[] }) => Promise<void>;
}) {
  const cfg = TYPE_CONFIG[item.course_type] ?? TYPE_CONFIG.OTHER;
  const [newPhrase, setNewPhrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddPhrase = async () => {
    const cleaned = newPhrase.trim().toLowerCase();
    if (!cleaned) return;
    if (item.phrases.includes(cleaned)) {
      setLocalError(`"${cleaned}" đã tồn tại`);
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      await onUpdate(item.id, { phrases: [...item.phrases, cleaned] });
      setNewPhrase("");
      inputRef.current?.focus();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Lỗi khi thêm từ khóa");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhrase = async (phrase: string) => {
    setSaving(true);
    setLocalError(null);
    try {
      await onUpdate(item.id, { phrases: item.phrases.filter((p) => p !== phrase) });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Lỗi khi xóa từ khóa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`relative flex flex-col gap-4 rounded-2xl border bg-slate-900/50 p-5 backdrop-blur-sm transition-all ${cfg.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${cfg.badge}`}
              >
                {item.course_type}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{cfg.desc}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border border-slate-700/50">
          {item.phrases.length} từ khóa
        </span>
      </div>

      {/* Phrases list */}
      <div className="flex flex-wrap gap-1.5 min-h-9">
        {item.phrases.length === 0 ? (
          <span className="text-xs text-slate-600 italic">Chưa có từ khóa nào</span>
        ) : (
          item.phrases.map((phrase) => (
            <span
              key={phrase}
              className="group flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-300 transition-all hover:border-slate-600"
            >
              {phrase}
              <button
                onClick={() => void handleRemovePhrase(phrase)}
                disabled={saving}
                className="ml-0.5 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all disabled:pointer-events-none cursor-pointer"
                title="Xóa từ khóa"
              >
                <X size={11} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Error */}
      {localError && (
        <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20">
          <AlertTriangle size={12} />
          {localError}
        </div>
      )}

      {/* Add phrase input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newPhrase}
          onChange={(e) => {
            setNewPhrase(e.target.value);
            setLocalError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAddPhrase();
          }}
          placeholder="Thêm từ khóa mới..."
          disabled={saving}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => void handleAddPhrase()}
          disabled={saving || !newPhrase.trim()}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <Plus size={13} />
          Thêm
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CourseTypeMappings() {
  const { data, loading, error, refresh, updateItem } = useCourseTypeMappings();

  const handleUpdate = async (id: string, payload: { phrases?: string[] }) => {
    await updateItem(id, payload);
  };

  // Sort by a fixed order
  const ORDER: CourseTypeKey[] = ["REQUIRED", "ELECTIVE", "ENGLISH", "PE", "DEFENSE", "OTHER"];
  const sorted = [...data].sort(
    (a, b) => ORDER.indexOf(a.course_type) - ORDER.indexOf(b.course_type)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0 flex items-center gap-2.5">
            <Tags className="text-indigo-500" />
            Phân Loại Môn Học
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Cấu hình các từ khóa để tự động nhận diện và phân loại môn học khi import Excel chương trình đào tạo.
            Parser sẽ kiểm tra <strong className="text-slate-300">tên môn</strong>,{" "}
            <strong className="text-slate-300">mã môn</strong> và{" "}
            <strong className="text-slate-300">giá trị cột loại môn</strong> so với danh sách từ khóa bên dưới.
          </p>
        </div>

        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer disabled:opacity-50 shrink-0 w-fit"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Tải lại
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-xs text-indigo-300 leading-relaxed">
        <strong>💡 Cách hoạt động:</strong> Khi import Excel, hệ thống sẽ quét từng môn học và so sánh với các từ khóa đã cấu hình.
        Ưu tiên theo thứ tự: <span className="font-mono bg-indigo-500/10 px-1 rounded">PE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">DEFENSE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">ENGLISH</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">ELECTIVE</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">REQUIRED</span> →{" "}
        <span className="font-mono bg-indigo-500/10 px-1 rounded">OTHER</span>.
        Từ khóa không phân biệt hoa thường.
      </div>

      {/* API Error */}
      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && data.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-1/2 bg-slate-800 rounded" />
                  <div className="h-3 w-3/4 bg-slate-800 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-6 w-16 rounded-lg bg-slate-800" />
                ))}
              </div>
              <div className="h-8 rounded-lg bg-slate-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((item) => (
            <CourseTypeCard key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
