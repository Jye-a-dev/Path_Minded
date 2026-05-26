import { Link } from "react-router-dom";
import { ShieldAlert, BookOpen, Cpu, Sparkles } from "lucide-react";

export default function MainpageIndex() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-12 px-4 text-center">
      {/* Dynamic background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-75 w-150 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 p-8 md:p-12 shadow-2xl backdrop-blur-md transition-all hover:shadow-indigo-500/5 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex items-center gap-1 rounded-full bg-indigo-600/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles size={12} className="animate-spin" />
            Cổng thông tin PathMinded v1.0
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:!text-white leading-none">
            Quản lý Ma trận <span className="text-indigo-600 dark:text-indigo-400">Cố vấn Học tập</span>
          </h1>
          
          <p className="max-w-2xl text-sm md:text-base text-zinc-500 dark:text-slate-400 font-medium">
            Tích hợp ma trận khung chương trình học, xử lý tải bảng điểm học tập của sinh viên, kiểm định điều kiện tiên quyết môn học và xuất lịch sử lớp học cấu trúc.
          </p>

          {/* Core Feature Cards */}
          <div className="grid gap-4 mt-8 w-full sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200/60 bg-white/40 p-5 dark:border-slate-800/60 dark:bg-slate-900/20">
              <Cpu className="h-6 w-6 mx-auto text-indigo-500" />
              <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-white">Đường ống Phân tích</h3>
              <p className="text-xs text-zinc-550 dark:text-slate-500 mt-1">Tự động phân tích bảng điểm</p>
            </div>
            
            <div className="rounded-xl border border-zinc-200/60 bg-white/40 p-5 dark:border-slate-800/60 dark:bg-slate-900/20">
              <BookOpen className="h-6 w-6 mx-auto text-indigo-500" />
              <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-white">Khung Đề cương</h3>
              <p className="text-xs text-zinc-550 dark:text-slate-500 mt-1">Bản đồ đề cương & kiểm tra môn tiên quyết</p>
            </div>
            
            <div className="rounded-xl border border-zinc-200/60 bg-white/40 p-5 dark:border-slate-800/60 dark:bg-slate-900/20">
              <ShieldAlert className="h-6 w-6 mx-auto text-indigo-500" />
              <h3 className="mt-2 text-sm font-bold text-zinc-800 dark:text-white">Thư mục Vai trò</h3>
              <p className="text-xs text-zinc-550 dark:text-slate-500 mt-1">Kiểm soát truy cập cố vấn & quản trị viên</p>
            </div>
          </div>

          {/* Shiny Navigation CTA */}
          <div className="pt-8">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:scale-[1.03] cursor-pointer"
            >
              Vào Bảng Điều Khiển &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}