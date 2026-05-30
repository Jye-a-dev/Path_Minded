import React, { useState } from "react";
import type { MappingItem } from "../../../../hooks/useCurriculumColumnMappings";
import { Edit2, Trash2, Tag, X, PlusCircle } from "lucide-react";

interface MappingCardProps {
  item: MappingItem;
  onEdit: (item: MappingItem) => void;
  onDelete: (item: MappingItem) => void;
  onAddPhrase: (item: MappingItem, phrase: string) => Promise<void>;
  onDeletePhrase: (item: MappingItem, phrase: string) => Promise<void>;
}

export const MappingCard: React.FC<MappingCardProps> = ({
  item,
  onEdit,
  onDelete,
  onAddPhrase,
  onDeletePhrase,
}) => {
  const [newPhrase, setNewPhrase] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;
    await onAddPhrase(item, newPhrase);
    setNewPhrase("");
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm transition-all hover:border-slate-700/80 hover:bg-slate-900/85 hover:shadow-indigo-950/10">
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
            {item.display_label}
          </h3>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {item.field_key}
            </span>
          </div>
        </div>

        {/* Edit & Delete Actions */}
        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            title="Sửa tên hiển thị"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <Edit2 size={12.5} />
          </button>
          <button
            onClick={() => onDelete(item)}
            title="Xóa cấu hình"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-all cursor-pointer"
          >
            <Trash2 size={12.5} />
          </button>
        </div>
      </div>

      {/* Phrase Pills List */}
      <div className="flex-1 mt-4 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Tag size={10} /> Từ khóa nhận diện ({item.phrases.length})
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {item.phrases.map((phrase) => (
            <span
              key={phrase}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-200 bg-slate-850 px-2 py-0.5 rounded-md border border-slate-800 group/pill hover:border-slate-700 transition-all"
            >
              {phrase}
              <button
                onClick={() => onDeletePhrase(item, phrase)}
                title={`Xóa từ khóa "${phrase}"`}
                className="text-slate-500 hover:text-rose-400 rounded transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {item.phrases.length === 0 && (
            <span className="text-[10px] text-slate-600 italic">
              Chưa có từ khóa nào (Sẽ dùng mặc định)
            </span>
          )}
        </div>
      </div>

      {/* Inline input to append new phrase */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Thêm từ khóa mới..."
            value={newPhrase}
            onChange={(e) => setNewPhrase(e.target.value)}
            className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-100 placeholder-slate-700 focus:border-indigo-600 focus:outline-none transition-all font-medium"
          />
          <button
            type="submit"
            title="Thêm từ khóa"
            className="p-1 rounded-md bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 transition-all cursor-pointer"
          >
            <PlusCircle size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
