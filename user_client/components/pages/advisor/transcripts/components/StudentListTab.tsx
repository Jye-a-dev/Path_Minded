import React, { useState, useMemo } from "react";
import { ChevronLeft, Search, GraduationCap, CheckCircle, XCircle, FileSpreadsheet, Upload } from "lucide-react";
import { StudentItem } from "../index";

interface StudentListTabProps {
  students: StudentItem[];
  currentClassName: string;
  onBackToClassSelect: () => void;
  onOpenStudentDetail: (student: StudentItem, tab: "results" | "uploads") => void;
}

export default function StudentListTab({
  students,
  currentClassName,
  onBackToClassSelect,
  onOpenStudentDetail
}: StudentListTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeStatusFilter, setGradeStatusFilter] = useState("");
  const [studyStatusFilter, setStudyStatusFilter] = useState("");

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery = !query || s.full_name.toLowerCase().includes(query) || s.student_code.toLowerCase().includes(query);
      
      const matchGrade = !gradeStatusFilter || 
        (gradeStatusFilter === "true" && s.has_grades) || 
        (gradeStatusFilter === "false" && !s.has_grades);

      const matchStudy = !studyStatusFilter || s.status === studyStatusFilter;

      return matchQuery && matchGrade && matchStudy;
    });
  }, [students, searchQuery, gradeStatusFilter, studyStatusFilter]);

  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToClassSelect}
            className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2.5 text-neutral-500 hover:bg-neutral-50 hover:border-zinc-300 transition-colors cursor-pointer"
            title="Quay lại chọn lớp"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 m-0">Quản lý Bảng điểm</h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-150 uppercase tracking-wide">
                Lớp: {currentClassName}
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Lựa chọn một sinh viên dưới đây để xem điểm chi tiết hoặc tải tệp bảng điểm Excel lên.
            </p>
          </div>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={gradeStatusFilter}
            onChange={(e) => setGradeStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-neutral-55 px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer hover:border-zinc-300"
          >
            <option value="">-- Tất cả trạng thái điểm --</option>
            <option value="true">Đã có điểm</option>
            <option value="false">Chưa có điểm</option>
          </select>

          <select
            value={studyStatusFilter}
            onChange={(e) => setStudyStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-neutral-55 px-3 py-2 text-xs font-semibold text-neutral-700 focus:outline-none focus:border-emerald-500 cursor-pointer hover:border-zinc-300"
          >
            <option value="">-- Tất cả trạng thái học --</option>
            <option value="ACTIVE">Đang học</option>
            <option value="GRADUATED">Tốt nghiệp</option>
            <option value="DROPPED">Thôi học</option>
          </select>
        </div>
      </div>

      {/* Students Data list */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative z-10">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <GraduationCap size={26} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">Không tìm thấy sinh viên nào</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Không tìm thấy sinh viên thỏa mãn điều kiện lọc trong lớp này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-450 border-b border-zinc-200 font-bold text-[9px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Mã sinh viên</th>
                  <th className="px-5 py-3.5">Họ và tên</th>
                  <th className="px-5 py-3.5">Khóa học</th>
                  <th className="px-5 py-3.5">Trạng thái học</th>
                  <th className="px-5 py-3.5">Trạng thái điểm</th>
                  <th className="px-5 py-3.5 text-right">Thao tác quản lý</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50 transition-colors text-neutral-700 font-medium">
                    <td className="px-5 py-4 font-mono text-neutral-900 font-bold">{s.student_code}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={15} className="text-emerald-650" />
                        <span className="font-bold text-neutral-900">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-neutral-450">{s.cohort_year ?? "N/A"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                        s.status === "GRADUATED" ? "bg-blue-50 text-blue-700 border-blue-150" : "bg-red-50 text-red-700 border-red-150"
                      }`}>
                        {s.status === "ACTIVE" ? "ĐANG HỌC" : s.status === "GRADUATED" ? "TỐT NGHIỆP" : "THÔI HỌC"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        s.has_grades ? "bg-emerald-50 text-emerald-750 border-emerald-150" : "bg-amber-50 text-amber-600 border-amber-150"
                      }`}>
                        {s.has_grades ? (
                          <>
                            <CheckCircle size={10} className="text-emerald-700" />
                            Có điểm
                          </>
                        ) : (
                          <>
                            <XCircle size={10} className="text-amber-500" />
                            Chưa có điểm
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => onOpenStudentDetail(s, "results")}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                          title="Quản lý điểm kết quả học tập"
                        >
                          <FileSpreadsheet size={12} />
                          Xem điểm số
                        </button>
                        <button
                          onClick={() => onOpenStudentDetail(s, "uploads")}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border border-emerald-100 transition cursor-pointer"
                          title="Lịch sử/Tải bảng điểm thô"
                        >
                          <Upload size={12} />
                          Tải bảng điểm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
