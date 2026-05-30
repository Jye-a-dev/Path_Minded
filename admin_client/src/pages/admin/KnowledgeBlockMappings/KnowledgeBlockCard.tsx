import { useState, useRef } from "react";
import type { KnowledgeBlockMappingItem, KBStatItem } from "../../../hooks/useKnowledgeBlockMappings";
import { Plus, X, AlertTriangle, Edit2, Trash2, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { TYPE_CONFIG } from "./knowledgeBlockConfig";

// ─── Single Card Component ─────────────────────────────────────────────────────
export function KnowledgeBlockCard({
  item,
  programStats,
  onUpdate,
  onEditLabel,
  onDelete,
}: {
  item: KnowledgeBlockMappingItem;
  programStats: KBStatItem[];
  onUpdate: (id: string, payload: { phrases?: string[] }) => Promise<void>;
  onEditLabel: (item: KnowledgeBlockMappingItem) => void;
  onDelete: (item: KnowledgeBlockMappingItem) => void;
}) {
  const cfg = TYPE_CONFIG[item.knowledge_block] ?? {
    ...TYPE_CONFIG.OTHER,
    desc: `Khối kiến thức tự định nghĩa cho ${item.label}`,
  };

  const [newPhrase, setNewPhrase] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCourses = programStats.reduce((sum, s) => sum + s.course_count, 0);

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
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{cfg.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm font-bold truncate ${cfg.color}`}>{item.label}</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold shrink-0 ${cfg.badge}`}
              >
                {item.knowledge_block}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed truncate">{cfg.desc}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="rounded-full bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border border-slate-700/50">
            {item.phrases.length} từ khóa
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onEditLabel(item)}
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Sửa tên khối"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
              title="Xóa khối"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Per-program stats — expandable */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 overflow-hidden">
        <button
          onClick={() => setShowStats((v) => !v)}
          disabled={programStats.length === 0}
          className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-colors cursor-pointer disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} />
            <span className="font-semibold">
              {totalCourses > 0 ? `${totalCourses} môn học` : "Chưa có môn học nào"}
            </span>
            {programStats.length > 0 && (
              <span className="text-slate-600">· {programStats.length} chương trình</span>
            )}
          </span>
          {programStats.length > 0 && (
            showStats ? <ChevronUp size={11} /> : <ChevronDown size={11} />
          )}
        </button>

        {showStats && programStats.length > 0 && (
          <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
            {programStats.map((stat) => (
              <div
                key={stat.program_id}
                className="flex items-center justify-between px-3 py-1.5 text-[11px]"
              >
                <span className="text-slate-400 truncate max-w-[72%]" title={stat.program_name}>
                  <span className="font-mono text-slate-500 mr-1.5">{stat.program_code}</span>
                  {stat.program_name}
                </span>
                <span className={`font-bold tabular-nums ${cfg.color}`}>
                  {stat.course_count}
                </span>
              </div>
            ))}
          </div>
        )}
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
