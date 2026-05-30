import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, LogIn } from "lucide-react";

export default function PublicNavbar() {
  return (
    <div className="relative pt-6 px-6 shrink-0 z-30 bg-zinc-50 select-none">
      <header className="relative w-full max-w-5xl mx-auto rounded-2xl border border-zinc-200/80 bg-white/70 shadow-lg shadow-zinc-200/5 px-6 py-3.5 backdrop-blur-md flex items-center justify-between transition-all hover:border-zinc-300">
        
        {/* Left Side: Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/20">
            PM
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            PathMinded
          </span>
        </Link>

        {/* Right Side Actions: Links & Portal Access */}
        <nav className="flex items-center gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? "text-indigo-600"
                  : "text-zinc-500 hover:text-zinc-900"
              }`
            }
          >
            Trang chủ
          </NavLink>

          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all cursor-pointer"
          >
            <LayoutDashboard size={12} />
            Bảng điều khiển
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <LogIn size={12} />
            Đăng nhập
          </Link>
        </nav>
      </header>
    </div>
  );
}
