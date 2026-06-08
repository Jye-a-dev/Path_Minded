import { DataTable } from "../../../../components/data_display/DataTable";
import { useStudents } from "../../../../hooks/useStudents";
import type { StudentItem } from "../../../../hooks/useStudents";
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileUp,
  ChevronLeft
} from "lucide-react";

interface StudentListTableProps {
  studentsHook: ReturnType<typeof useStudents>;
  gradeStatusFilter: string;
  studyStatusFilter: string;
  handleStudentGradeFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleStudentStudyFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleResetConfig: () => void;
  selectedMajor: string;
  currentClassName: string;
  handleOpenStudentDetail: (student: StudentItem, tab: "results" | "uploads") => void;
}

export function StudentListTable({
  studentsHook,
  gradeStatusFilter,
  studyStatusFilter,
  handleStudentGradeFilterChange,
  handleStudentStudyFilterChange,
  handleResetConfig,
  selectedMajor,
  currentClassName,
  handleOpenStudentDetail,
}: StudentListTableProps) {

  // Student Table columns configuration
  const studentTableColumns = [
    {
      header: "Mã sinh viên",
      accessorKey: "student_code",
      render: (row: StudentItem) => (
        <span className="font-mono text-xs font-bold text-slate-200 block">
          {row.student_code}
        </span>
      ),
    },
    {
      header: "Họ và tên",
      accessorKey: "full_name",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-indigo-400" />
          <span className="text-slate-255! font-bold hover:text-indigo-400 transition-colors">
            {row.full_name}
          </span>
        </div>
      ),
    },
    {
      header: "Khóa học",
      accessorKey: "cohort_year",
      render: (row: StudentItem) => (
        <span className="text-slate-400 font-semibold">{row.cohort_year ?? "N/A"}</span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      render: (row: StudentItem) => {
        const badges: Record<string, string> = {
          ACTIVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          GRADUATED: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
          DROPPED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusLabels: Record<string, string> = {
          ACTIVE: "ĐANG HỌC",
          GRADUATED: "TỐT NGHIỆP",
          DROPPED: "THÔI HỌC",
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.status]}`}
          >
            {statusLabels[row.status]}
          </span>
        );
      },
    },
    {
      header: "Trạng thái điểm",
      accessorKey: "has_grades",
      render: (row: StudentItem) => {
        const hasGrades = row.has_grades;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${
              hasGrades
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {hasGrades ? (
              <>
                <CheckCircle2 size={10} className="text-emerald-400" />
                Có điểm
              </>
            ) : (
              <>
                <XCircle size={10} className="text-amber-400" />
                Chưa có điểm
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "Thao tác quản lý",
      render: (row: StudentItem) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenStudentDetail(row, "results")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-650 hover:text-white transition-all cursor-pointer"
            title="Quản lý điểm kết quả học tập"
          >
            <FileSpreadsheet size={13} />
            Xem điểm số
          </button>
          <button
            onClick={() => handleOpenStudentDetail(row, "uploads")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-605 hover:text-white transition-all cursor-pointer"
            title="Tải bảng điểm gốc"
          >
            <FileUp size={13} />
            Tải bảng điểm
          </button>
        </div>
      ),
    },
  ];

  const studentFiltersBlock = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Grade status filter */}
      <select
        value={gradeStatusFilter}
        onChange={handleStudentGradeFilterChange}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
      >
        <option className="bg-slate-900 text-slate-400" value="">-- Tất cả trạng thái điểm --</option>
        <option className="bg-slate-900 text-white font-medium" value="true">Đã có điểm (Có điểm)</option>
        <option className="bg-slate-900 text-white font-medium" value="false">Chưa có điểm</option>
      </select>

      {/* Study status filter */}
      <select
        value={studyStatusFilter}
        onChange={handleStudentStudyFilterChange}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-600"
      >
        <option className="bg-slate-900 text-slate-400" value="">-- Tất cả trạng thái học --</option>
        <option className="bg-slate-900 text-white font-medium" value="ACTIVE">Đang học (ACTIVE)</option>
        <option className="bg-slate-900 text-white font-medium" value="GRADUATED">Tốt nghiệp (GRADUATED)</option>
        <option className="bg-slate-900 text-white font-medium" value="DROPPED">Thôi học (DROPPED)</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetConfig}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Quản lý điểm số</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                {currentClassName}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Hãy chọn một sinh viên bên dưới để xem điểm chi tiết hoặc tải tệp bảng điểm lên.
            </p>
          </div>
        </div>
      </div>

      {studentsHook.error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {studentsHook.error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<StudentItem>
        columns={studentTableColumns}
        data={studentsHook.data}
        loading={studentsHook.loading}
        total={studentsHook.total}
        page={studentsHook.page}
        limit={studentsHook.limit}
        onPageChange={studentsHook.setPage}
        onLimitChange={studentsHook.setLimit}
        searchValue={studentsHook.search}
        onSearchChange={studentsHook.setSearch}
        searchPlaceholder="Tìm kiếm mã số hoặc họ tên sinh viên..."
        filters={studentFiltersBlock}
      />
    </div>
  );
}
