import { Link, NavLink } from "react-router-dom";
import { Sparkles, LayoutDashboard, LogIn } from "lucide-react";

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

        {/* Middle "Tai Thỏ" Notch visual indicator */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center">
          <div className="relative flex items-center justify-center bg-white border-x border-b border-zinc-200/80 px-7 py-1.5 rounded-b-xl shadow-lg -mt-3.5 border-t border-t-white">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} className="animate-spin text-indigo-500" />
              Syllabus Matrix
            </span>
            <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-10 h-0.5 bg-indigo-600 shadow-lg shadow-indigo-600/40"></span>
          </div>
        </div>

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
            Home
          </NavLink>

          <Link
            to="/admin"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-all cursor-pointer"
          >
            <LayoutDashboard size={12} />
            Dashboard
          </Link>

          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <LogIn size={12} />
            Sign In
          </Link>
        </nav>
      </header>
    </div>
  );
}
