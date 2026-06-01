import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, LogIn } from "lucide-react";

export default function PublicNavbar() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className={`relative pt-6 px-6 shrink-0 z-30 select-none transition-colors duration-500 ${isLoginPage ? "bg-transparent" : "bg-zinc-50"}`}>
      <header className={`relative w-full max-w-5xl mx-auto rounded-2xl border px-6 py-3.5 backdrop-blur-md flex items-center justify-between transition-all duration-500 ${
        isLoginPage
          ? "border-slate-800/80 bg-slate-950/40 shadow-lg shadow-black/25 hover:border-slate-700"
          : "border-zinc-200/80 bg-white/70 shadow-lg shadow-zinc-200/5 hover:border-zinc-300"
      }`}>
        
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/20">
            PM
          </div>
          <span className={`text-lg font-bold tracking-tight transition-colors duration-500 ${isLoginPage ? "text-white" : "text-zinc-900"}`}>
            PathMinded
          </span>
        </Link>

        {/* Right Side Actions: Links & Portal Access */}
        <nav className="flex items-center gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition duration-300 ${
                isActive
                  ? "text-indigo-600"
                  : isLoginPage
                    ? "text-slate-400 hover:text-white"
                    : "text-zinc-500 hover:text-zinc-900"
              }`
            }
          >
            Trang chủ
          </NavLink>

          <Link
            to="/admin"
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              isLoginPage
                ? "border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <LayoutDashboard size={12} />
            Bảng điều khiển
          </Link>

          <Link
            to="/login"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-300 cursor-pointer ${
              isLoginPage
                ? "bg-indigo-600/80 shadow-indigo-600/20 hover:bg-indigo-500 ring-2 ring-indigo-500/30"
                : "bg-indigo-600 shadow-indigo-600/10 hover:bg-indigo-500"
            }`}
          >
            <LogIn size={12} />
            Đăng nhập
          </Link>
        </nav>
      </header>
    </div>
  );
}

