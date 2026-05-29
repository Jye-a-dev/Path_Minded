// ─── Column mapping item type ─────────────────────────────────────────────────
export interface ColMappingItem {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
}

// ─── Color config per course_type ─────────────────────────────────────────────
export const TYPE_CONFIG: Record<
  string,
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
