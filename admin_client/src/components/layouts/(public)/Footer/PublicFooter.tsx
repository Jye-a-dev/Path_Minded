import { Link, useLocation } from "react-router-dom";

export default function PublicFooter() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <footer className={`mt-auto border-t py-8 text-xs select-none transition-colors duration-500 backdrop-blur-md ${
      isLoginPage
        ? "border-slate-900 bg-slate-950/20 text-slate-400"
        : "border-zinc-200 bg-white/70 text-zinc-500"
    }`}>
      <div className="mx-auto max-w-5xl w-full px-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`font-bold flex items-center gap-1.5 transition-colors duration-500 ${isLoginPage ? "text-slate-200" : "text-zinc-800"}`}>
            <span className={`h-2 w-2 rounded transition-all duration-500 ${isLoginPage ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-indigo-600"}`}></span>
            Nền tảng Cố vấn PathMinded
          </p>
          <p className={`mt-1 font-medium transition-colors duration-500 ${isLoginPage ? "text-slate-500" : "text-zinc-500"}`}>
            Tự động kiểm định đề cương môn học và kiểm tra điều kiện tiên quyết môn học theo ma trận.
          </p>
        </div>
        <div className={`flex flex-wrap gap-x-6 gap-y-2 font-bold transition-colors duration-500 ${isLoginPage ? "text-slate-400" : "text-zinc-600"}`}>
          <Link to="/" className={`transition-colors ${isLoginPage ? "hover:text-indigo-400" : "hover:text-indigo-600"}`}>Trang chủ</Link>
          <Link to="/admin" className={`transition-colors ${isLoginPage ? "hover:text-indigo-400" : "hover:text-indigo-600"}`}>Bảng điều khiển</Link>
          <Link to="/login" className={`transition-colors ${isLoginPage ? "hover:text-indigo-400" : "hover:text-indigo-600"}`}>Đăng nhập cho Cố vấn</Link>
        </div>
      </div>

      <div className={`mx-auto max-w-5xl w-full px-6 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t pt-4 text-[10px] uppercase tracking-wider font-bold transition-colors duration-500 ${
        isLoginPage
          ? "border-slate-900/50 text-slate-500"
          : "border-zinc-200/50 text-zinc-555"
      }`}>
        <span>© {new Date().getFullYear()} PathMinded Inc. Bảo lưu mọi quyền.</span>
        <span className="flex items-center gap-1.5 mt-2 sm:mt-0">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          Hệ thống thu nhận dữ liệu đang hoạt động
        </span>
      </div>
    </footer>
  );
}

