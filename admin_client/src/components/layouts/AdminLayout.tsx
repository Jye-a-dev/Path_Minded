import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import Navbar from "./@base/Navbar/Navbar";
import Footer from "./@base/Footer/Footer";

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
        <Navbar
          className="relative w-full max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-lg shadow-indigo-950/5 px-6 py-3.5 backdrop-blur-md flex items-center justify-between transition-all hover:border-slate-700/80"
          leftContent={
            <>
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
            </>
          }
          rightContent={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 select-none shadow-xs shadow-emerald-500/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CSDL Ma trận trực tuyến
            </span>
          }
        />

        {/* Content Outlet wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex-1 max-w-5xl w-full mx-auto pb-8">
            <Outlet />
          </div>
          
          {/* Custom Sleek Glassmorphic Portal Footer */}
          <Footer
            className="mt-12 pt-8 border-t border-slate-900/60 text-slate-500 text-xs max-w-5xl w-full mx-auto select-none"
            brandName="Ma trận điều khiển học thuật PathMinded"
            brandDescription="Hệ thống tư vấn ma trận dành cho quản trị viên và giảng viên được ủy quyền."
            brandIndicatorColor="bg-indigo-500"
            brandTextClass="font-bold text-slate-400 flex items-center gap-1.5"
            descriptionTextClass="mt-1 text-slate-500 font-medium"
            linkClass="hover:text-indigo-400 transition-colors"
            links={[
              { label: "Bảng điều khiển", to: "/admin" },
              { label: "Sinh viên", to: "/admin/students" },
              { label: "Nhập dữ liệu", to: "/admin/curriculum_imports" },
              { label: "Tài liệu hướng dẫn", href: "https://github.com", external: true },
            ]}
            bottomLeftText={`© ${new Date().getFullYear()} PathMinded Inc. Bảo lưu mọi quyền.`}
            bottomRightText="Đã kết nối công cụ kiểm định CSDL"
            bottomTextClass="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-900/40 pt-4 text-[10px] uppercase tracking-wider text-slate-650 font-bold"
          />
        </main>
      </div>
    </div>
  );
}
