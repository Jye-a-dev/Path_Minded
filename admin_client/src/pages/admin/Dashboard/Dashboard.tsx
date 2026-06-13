import { Link } from "react-router-dom";
import { useDashboardStats } from "../../../hooks/useDashboardStats";
import {
  Users,
  Briefcase,
  BookOpen,
  Building2,
  GraduationCap,
  TrendingUp,
  UploadCloud,
  FileUp,
  DownloadCloud,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.users,
      icon: Users,
      color: "from-blue-600/20 to-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      label: "Cố vấn học tập",
      value: stats.advisors,
      icon: Briefcase,
      color: "from-amber-600/20 to-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      label: "Chương trình đào tạo",
      value: stats.programs,
      icon: BookOpen,
      color: "from-purple-600/20 to-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      label: "Lớp học hoạt động",
      value: stats.classes,
      icon: Building2,
      color: "from-pink-600/20 to-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      label: "Tổng số sinh viên",
      value: stats.students,
      icon: GraduationCap,
      color: "from-emerald-600/20 to-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Tổng quan Bảng điều khiển</h1>
        <p className="mt-2 text-sm text-slate-400">
          Số liệu thời gian thực và trạng thái của hệ thống cơ sở dữ liệu ma trận cố vấn học tập.
        </p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border bg-linear-to-br p-6 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] ${card.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {card.label}
                    </span>
                    <Icon className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-white">
                      {card.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Imports Manager shortcuts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                Đường ống Thu thập Dữ liệu
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Dễ dàng khởi chạy các phiên nhập liệu mới cho chương trình học dạng bảng hoặc báo cáo học tập.
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/admin/programs?tab=imports"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-indigo-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Nhập chương trình học (Excel)</p>
                      <p className="text-[10px] text-slate-500">Bản đồ đề cương & điều kiện môn học</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-400">Bắt đầu &rarr;</span>
                </Link>

                <Link
                  to="/admin/transcript_uploads"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileUp className="h-5 w-5 text-indigo-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Tải bảng điểm lên</p>
                      <p className="text-[10px] text-slate-500">Phân tích dữ liệu kết quả học tập dán sẵn</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-400">Bắt đầu &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Matrix Export shortcuts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-emerald-400" />
                Trung tâm Báo cáo & Xuất dữ liệu
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Kích hoạt xuất báo cáo kiểm định cấu trúc để trực quan hóa ma trận cố vấn học tập.
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/admin/exports"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <DownloadCloud className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Xuất dữ liệu Kiểm định Ma trận</p>
                      <p className="text-[10px] text-slate-500">Tạo tài liệu ma trận cố vấn học tập</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">Thực hiện &rarr;</span>
                </Link>

                <Link
                  to="/admin/export_logs"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Chỉ số Tiến độ Lớp học</p>
                      <p className="text-[10px] text-slate-500">Xem tiến trình theo lớp & sinh viên</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">Xem &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
