import { useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 antialiased font-sans">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Standalone Sidebar Component */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sleek Floating "Tai Thỏ" Notched Middle Top Navbar */}
        <div className="relative pt-6 px-6 md:px-8 shrink-0 z-30">
          <header className="relative w-full max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-indigo-950/5 px-6 py-3.5 backdrop-blur-md flex items-center justify-between transition-all hover:border-slate-700/80">
            {/* Left side actions */}
            <div className="flex items-center gap-4">
              <button
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              
              {/* Notched Status Indicator */}
              <div className="hidden items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 border border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 sm:flex select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Hệ thống điều khiển đang hoạt động</span>
              </div>
            </div>

            {/* "Tai thỏ middle" notch visual indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center select-none">
              <div className="relative flex items-center justify-center bg-slate-900 border-x border-b border-slate-800 px-7 py-1.5 rounded-b-xl shadow-lg -mt-3.5 border-t border-t-slate-900">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Kiểm định PathMinded
                </span>
                {/* Dynamic notch accent glow */}
                <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-10 h-0.5 bg-indigo-500 shadow-lg shadow-indigo-500/50"></span>
              </div>
            </div>

            {/* Right side connection info */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 select-none shadow-xs shadow-emerald-500/5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                CSDL Ma trận trực tuyến
              </span>
            </div>
          </header>
        </div>

        {/* Content Outlet wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex-1 max-w-5xl w-full mx-auto pb-8">
            <Outlet />
          </div>
          
          {/* Custom Sleek Glassmorphic Portal Footer */}
          <footer className="mt-12 pt-8 border-t border-slate-900/60 text-slate-500 text-xs max-w-5xl w-full mx-auto select-none">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded bg-indigo-500"></span>
                  Ma trận điều khiển học thuật PathMinded
                </p>
                <p className="mt-1 text-slate-500 font-medium">Hệ thống tư vấn ma trận dành cho quản trị viên và giảng viên được ủy quyền.</p>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-400 font-semibold">
                <Link to="/admin" className="hover:text-indigo-400 transition-colors">Bảng điều khiển</Link>
                <Link to="/admin/students" className="hover:text-indigo-400 transition-colors">Sinh viên</Link>
                <Link to="/admin/curriculum_imports" className="hover:text-indigo-400 transition-colors">Nhập dữ liệu</Link>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Tài liệu hướng dẫn</a>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-900/40 pt-4 text-[10px] uppercase tracking-wider text-slate-650 font-bold">
              <span>© {new Date().getFullYear()} PathMinded Inc. Bảo lưu mọi quyền.</span>
              <span className="flex items-center gap-1.5 mt-2 sm:mt-0">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                Đã kết nối công cụ kiểm định CSDL
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
