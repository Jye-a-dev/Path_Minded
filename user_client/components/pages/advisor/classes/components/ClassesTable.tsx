import React from "react";
import { Building2, Edit2, Trash2 } from "lucide-react";
import { ClassItem } from "./ClassModal";

interface ClassesTableProps {
  classes: ClassItem[];
  onEdit: (item: ClassItem) => void;
  onDelete: (item: ClassItem) => void;
  getProgramName: (id: string | null) => string;
  currentAdvisorName: string;
}

export default function ClassesTable({
  classes,
  onEdit,
  onDelete,
  getProgramName,
  currentAdvisorName
}: ClassesTableProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
          <Building2 size={26} />
        </div>
        <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy lớp học nào</h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
          Bạn chưa phụ trách lớp học nào. Hãy tạo một lớp học mới.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
            <th className="px-5 py-3.5">Mã lớp</th>
            <th className="px-5 py-3.5">Tên lớp học</th>
            <th className="px-5 py-3.5">Niên khóa</th>
            <th className="px-5 py-3.5">Cố vấn phụ trách</th>
            <th className="px-5 py-3.5">Chương trình đào tạo</th>
            <th className="px-5 py-3.5 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {classes.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-neutral-50/50 transition-colors text-neutral-700 bg-emerald-50/10"
            >
              <td className="px-5 py-4 font-mono font-bold text-neutral-905 text-xs">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 text-[10px] text-emerald-800 font-bold uppercase">
                  {item.class_code}
                </span>
              </td>
              <td className="px-5 py-4 font-semibold text-neutral-900">
                {item.class_name || "—"}
              </td>
              <td className="px-5 py-4 text-neutral-505 font-bold font-mono">
                {item.cohort_year ?? "—"}
              </td>
              <td className="px-5 py-4 text-neutral-600 font-medium">
                {currentAdvisorName}
              </td>
              <td className="px-5 py-4 text-neutral-600">
                {getProgramName(item.program_id)}
              </td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <button
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Sửa thông tin"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition-colors cursor-pointer"
                    title="Xóa lớp"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
