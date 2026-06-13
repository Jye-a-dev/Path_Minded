import { useState, Suspense } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import Navbar from "./@base/Navbar/Navbar";
import Footer from "./@base/Footer/Footer";
import PageLoader from "../../router/PageLoader";
import { useSettings } from "../../providers/SettingsContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen bg-slate-900 text-slate-100 antialiased font-sans overflow-hidden">
      <style>{`
        /* Dynamic Theme Overrides */
        :root {
          --theme-bg-val: var(--theme-bg, #0f172a);
          --theme-bg-deep-val: var(--theme-bg-deep, #020617);
          --theme-bg-card-val: var(--theme-bg-card, rgba(15, 23, 42, 0.6));
          --theme-border-val: var(--theme-border, rgba(30, 41, 59, 0.8));
          --primary-val: var(--primary-color, #4f46e5);
          --primary-hover-val: var(--primary-hover, #4338ca);
          --primary-light-val: var(--primary-light, #818cf8);
          --theme-text-val: var(--theme-text, #f1f5f9);
          --theme-text-muted-val: var(--theme-text-muted, #94a3b8);
          --theme-text-title-val: var(--theme-text-title, #ffffff);
          --theme-bg-btn-val: var(--theme-bg-btn, #1e293b);
          --theme-bg-mid-val: var(--theme-bg-mid, #172033);
        }

        /* 1. Global backgrounds and borders overrides */
        body, .bg-slate-900 {
          background-color: var(--theme-bg-val) !important;
          color: var(--theme-text-val) !important;
        }
        .bg-slate-955, .bg-slate-955\\/60, .bg-slate-955\\/40, .bg-slate-950, .bg-slate-950\\/40, .bg-slate-950\\/60 {
          background-color: var(--theme-bg-deep-val) !important;
        }
        .bg-slate-900\\/20, .bg-slate-900\\/40, .bg-slate-900\\/60, .bg-slate-900\\/45, .bg-slate-900\\/80, .bg-slate-900\\/90 {
          background-color: var(--theme-bg-card-val) !important;
        }
        .bg-slate-800, .bg-slate-800\\/40, .bg-slate-800\\/50, .bg-slate-800\\/60, .bg-slate-800\\/80,
        .bg-slate-700, .bg-slate-850, .bg-slate-850\\/80 {
          background-color: var(--theme-bg-btn-val) !important;
        }
        .hover\\:bg-slate-800\\/60:hover, .hover\\:bg-slate-800:hover, .hover\\:bg-slate-700:hover,
        .hover\\:bg-slate-800\\/40:hover, .hover\\:bg-slate-850:hover {
          background-color: var(--theme-bg-btn-val) !important;
          opacity: 0.9 !important;
        }
        .hover\\:bg-slate-900\\/40:hover {
          background-color: var(--theme-bg-card-val) !important;
          opacity: 0.9 !important;
        }
        .border-slate-800, .border-slate-805, .border-slate-800\\/50, .border-slate-800\\/80, .border-slate-800\\/60,
        .border-slate-900\\/60, .border-slate-900\\/40, .border-slate-700, .border-slate-700\\/50,
        .border-slate-800\\/30, .border-slate-900 {
          border-color: var(--theme-border-val) !important;
        }
        .divide-slate-800 > * + *, .divide-slate-800\\/60 > * + *, .divide-slate-700 > * + * {
          border-color: var(--theme-border-val) !important;
        }

        /* 2. Global text and title overrides */
        .text-slate-50, .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-350,
        .text-slate-250, .text-slate-100\\!, .text-slate-200\\!, .text-slate-300\\! {
          color: var(--theme-text-val) !important;
        }
        .text-slate-400, .text-slate-500, .text-slate-450, .text-slate-400\\!, .text-slate-500\\! {
          color: var(--theme-text-muted-val) !important;
        }
        .text-slate-600, .text-slate-650 {
          color: var(--theme-text-muted-val) !important;
          opacity: 0.7;
        }
        .text-white, .text-white\\!, h1, h2, h3, h4, h5, h6 {
          color: var(--theme-text-title-val) !important;
        }
        /* Placeholder and disabled states */
        .placeholder\\:text-slate-500::placeholder, .placeholder\\:text-slate-600::placeholder {
          color: var(--theme-text-muted-val) !important;
          opacity: 0.7;
        }

        /* 3. Input and form element overrides */
        input, select, textarea {
          background-color: var(--theme-bg-btn-val) !important;
          color: var(--theme-text-val) !important;
          border-color: var(--theme-border-val) !important;
        }
        input::placeholder, select::placeholder, textarea::placeholder {
          color: var(--theme-text-muted-val) !important;
          opacity: 0.7;
        }
        .bg-slate-800\\/50:is(input), .bg-slate-900:is(input), .bg-slate-950:is(input) {
          background-color: var(--theme-bg-btn-val) !important;
        }

        /* 4. Global primary accent overrides (overrides bg-indigo-* and text-indigo-*) */
        .bg-indigo-600, .bg-indigo-650, .bg-indigo-600\\/90 {
          background-color: var(--primary-val) !important;
        }
        .hover\\:bg-indigo-500:hover, .hover\\:bg-indigo-650:hover, .hover\\:bg-indigo-600:hover {
          background-color: var(--primary-hover-val) !important;
        }
        .text-indigo-400, .text-indigo-300, .text-indigo-500 {
          color: var(--primary-light-val) !important;
        }
        .border-indigo-500\\/20, .border-indigo-500\\/30, .border-indigo-600\\/30 {
          border-color: rgba(var(--primary-rgb), 0.25) !important;
        }
        .bg-indigo-500\\/10, .bg-indigo-600\\/10 {
          background-color: rgba(var(--primary-rgb), 0.1) !important;
        }
        .bg-indigo-500\\/20, .bg-indigo-600\\/20, .bg-indigo-950 {
          background-color: rgba(var(--primary-rgb), 0.15) !important;
        }
        .bg-indigo-800 {
          background-color: rgba(var(--primary-rgb), 0.2) !important;
        }
        .shadow-indigo-600\\/30 {
          --tw-shadow-color: rgba(var(--primary-rgb), 0.3) !important;
        }
        .shadow-indigo-600\\/20 {
          --tw-shadow-color: rgba(var(--primary-rgb), 0.2) !important;
        }
        .shadow-indigo-600\\/15 {
          --tw-shadow-color: rgba(var(--primary-rgb), 0.15) !important;
        }
        .text-indigo-400\\! {
          color: var(--primary-light-val) !important;
        }
        .border-indigo-600, .border-indigo-800 {
          border-color: var(--primary-val) !important;
        }
        /* Active NavLink uses bg-indigo-600 — keep its text white */
        .bg-indigo-600 *, .bg-indigo-600\\/90 * {
          color: #ffffff !important;
        }
      `}</style>

      {/* Mesh Glow Background */}
      {settings.meshGradient && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-15">
          <div className="absolute top-[-30%] left-[-20%] h-[70%] w-[60%] rounded-full bg-indigo-500/35 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[60%] w-[50%] rounded-full bg-teal-500/25 blur-[120px]" />
        </div>
      )}

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
      <div className="flex flex-1 flex-col overflow-hidden z-10">
        {/* Sleek Floating "Tai Thỏ" Notched Middle Top Navbar */}
        {settings.showNavbar && (
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
        )}

        {/* Content Outlet wrapper */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 md:p-8 flex flex-col justify-between">
          <div className="flex-1 max-w-5xl w-full mx-auto pb-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
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
              { label: "Nhập dữ liệu", to: "/admin/programs?tab=imports" },
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
