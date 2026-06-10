import React from "react";
import { Users, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { StudentItem } from "./StudentModal";

interface StudentsTableProps {
  students: StudentItem[];
  onEdit: (item: StudentItem) => void;
  onDelete: (item: StudentItem) => void;
  getClassName: (id?: string | null) => string;
  getProgramCode: (id?: string | null) => string;
}

export default function StudentsTable({
  students,
  onEdit,
  onDelete,
  getClassName,
  getProgramCode
}: StudentsTableProps) {
  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-250">
            Đang học
          </span>
        );
      case "GRADUATED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-250">
            Tốt nghiệp
          </span>
        );
      case "DROPPED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-250">
            Thôi học
          </span>
        );
      default:
        return null;
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
          <Users size={26} />
        </div>
        <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy sinh viên nào</h3>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
          Bạn chưa quản lý sinh viên nào trong các lớp học được giao.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
            <th className="px-5 py-3.5">MSSV</th>
            <th className="px-5 py-3.5">Họ và tên</th>
            <th className="px-5 py-3.5">Lớp</th>
            <th className="px-5 py-3.5">Khóa</th>
            <th className="px-5 py-3.5">Chương trình đào tạo</th>
            <th className="px-5 py-3.5">Tài khoản</th>
            <th className="px-5 py-3.5">Trạng thái</th>
            <th className="px-5 py-3.5 text-right">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {students.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-neutral-50/50 transition-colors text-neutral-700 bg-emerald-50/5"
            >
              <td className="px-5 py-4 font-mono font-bold text-neutral-900 text-xs">
                {item.student_code}
              </td>
              <td className="px-5 py-4 font-semibold text-neutral-900">
                {item.full_name}
              </td>
              <td className="px-5 py-4 font-bold text-neutral-600">
                {getClassName(item.class_id)}
              </td>
              <td className="px-5 py-4 text-neutral-500 font-bold font-mono">
                K{item.cohort_year ?? "—"}
              </td>
              <td className="px-5 py-4 text-neutral-500">
                {getProgramCode(item.program_id)}
              </td>
              <td className="px-5 py-4 font-mono text-neutral-500 text-xs">
                {item.user_id ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={10} /> Đã liên kết
                  </span>
                ) : (
                  <span className="text-zinc-300 font-normal">Chưa tạo TK</span>
                )}
              </td>
              <td className="px-5 py-4">{getStatusBadge(item.status)}</td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex items-center gap-2 justify-end">
                  <button
                    onClick={() => onEdit(item)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-emerald-55 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Sửa hồ sơ"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-red-105 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-650 transition-colors cursor-pointer"
                    title="Xóa hồ sơ"
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
