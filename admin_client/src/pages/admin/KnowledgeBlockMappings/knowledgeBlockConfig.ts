// ─── Column mapping item type ─────────────────────────────────────────────────
export interface ColMappingItem {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
}

// ─── Color config per knowledge_block ─────────────────────────────────────────
export const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; badge: string; border: string; icon: string; desc: string }
> = {
  GENERAL: {
    label: "Đại cương",
    color: "text-indigo-400",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    border: "border-indigo-500/20 hover:border-indigo-500/40",
    icon: "📚",
    desc: "Khối kiến thức cơ bản đại cương, lý luận chính trị, kỹ năng mềm",
  },
  SECTOR_CORE: {
    label: "Cơ sở khối ngành",
    color: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    border: "border-orange-500/20 hover:border-orange-500/40",
    icon: "🏗️",
    desc: "Kiến thức nền tảng chung của nhóm ngành đào tạo",
  },
  MAJOR_CORE: {
    label: "Cơ sở ngành",
    color: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    icon: "⚙️",
    desc: "Kiến thức cốt lõi nền tảng riêng của ngành học",
  },
  SPECIALIZED: {
    label: "Chuyên ngành",
    color: "text-sky-400",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    border: "border-sky-500/20 hover:border-sky-500/40",
    icon: "🚀",
    desc: "Kiến thức nâng cao chuyên sâu, đồ án và thực tập tốt nghiệp",
  },
  OTHER: {
    label: "Khác",
    color: "text-slate-400",
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    border: "border-slate-500/20 hover:border-slate-500/40",
    icon: "📦",
    desc: "Các khối kiến thức tự định nghĩa khác",
  },
};
