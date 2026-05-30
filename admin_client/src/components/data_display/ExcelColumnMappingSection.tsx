import { useState, useEffect } from "react";
import { FileSpreadsheet, Plus, X, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";

export interface ColMappingItem {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
}

interface ExcelColumnMappingSectionProps {
  fieldKey: "course_type" | "knowledge_block";
  title: string;
  description: string;
  inputPlaceholder: string;
}

export function ExcelColumnMappingSection({
  fieldKey,
  title,
  description,
  inputPlaceholder,
}: ExcelColumnMappingSectionProps) {
  const [colMapping, setColMapping] = useState<ColMappingItem | null>(null);
  const [colSaving, setColSaving] = useState(false);
  const [newColPhrase, setNewColPhrase] = useState("");
  const [colError, setColError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await api.get<ColMappingItem[]>("/curriculum_column_mappings");
        if (!active) return;
        const item = res.data.find((m) => m.field_key === fieldKey);
        if (item) {
          setColMapping(item);
        }
      } catch (err) {
        console.error("Lỗi khi tải cấu hình cột:", err);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [fieldKey]);

  const handleAddColPhrase = async () => {
    const cleaned = newColPhrase.trim().toLowerCase();
    if (!cleaned || !colMapping) return;
    if (colMapping.phrases.includes(cleaned)) {
      setColError(`"${cleaned}" đã tồn tại`);
      return;
    }
    setColSaving(true);
    setColError(null);
    try {
      const updated = [...colMapping.phrases, cleaned];
      const res = await api.patch<ColMappingItem>(
        `/curriculum_column_mappings/${colMapping.id}`,
        { phrases: updated }
      );
      setColMapping(res.data);
      setNewColPhrase("");
    } catch (err) {
      setColError(err instanceof Error ? err.message : "Lỗi khi thêm từ khóa");
    } finally {
      setColSaving(false);
    }
  };

  const handleRemoveColPhrase = async (phrase: string) => {
    if (!colMapping) return;
    setColSaving(true);
    setColError(null);
    try {
      const updated = colMapping.phrases.filter((p) => p !== phrase);
      const res = await api.patch<ColMappingItem>(
        `/curriculum_column_mappings/${colMapping.id}`,
        { phrases: updated }
      );
      setColMapping(res.data);
    } catch (err) {
      setColError(err instanceof Error ? err.message : "Lỗi khi xóa từ khóa");
    } finally {
      setColSaving(false);
    }
  };

  if (!colMapping) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/30 p-5 backdrop-blur-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/85 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {title}
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                System Key: {colMapping.field_key}
              </span>
            </h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-semibold text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0 self-start sm:self-center">
          {colMapping.phrases.length} tên cột được cấu hình
        </div>
      </div>

      {/* Phrase list */}
      <div className="flex flex-wrap gap-2 min-h-9">
        {colMapping.phrases.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Chưa cấu hình tên cột nào</span>
        ) : (
          colMapping.phrases.map((phrase: string) => (
            <span
              key={phrase}
              className="group flex items-center gap-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/20 px-3 py-1.5 text-xs text-slate-200 transition-all"
            >
              {phrase}
              <button
                onClick={() => void handleRemoveColPhrase(phrase)}
                disabled={colSaving}
                className="ml-1 rounded text-slate-400 opacity-60 group-hover:opacity-100 hover:text-rose-400 transition-all cursor-pointer"
                title="Xóa tên cột"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {colError && (
        <div className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400 border border-rose-500/20 w-fit">
          <AlertTriangle size={12} />
          {colError}
        </div>
      )}

      {/* Add Phrase Input */}
      <div className="flex gap-2.5 max-w-md">
        <input
          type="text"
          value={newColPhrase}
          onChange={(e) => {
            setNewColPhrase(e.target.value);
            setColError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleAddColPhrase();
          }}
          placeholder={inputPlaceholder}
          disabled={colSaving}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
        />
        <button
          onClick={() => void handleAddColPhrase()}
          disabled={colSaving || !newColPhrase.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
        >
          <Plus size={14} />
          Thêm
        </button>
      </div>
    </div>
  );
}
