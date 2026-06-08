import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Users,
  Briefcase,
  BookOpen,
  Building2,
  GraduationCap,
  Bookmark,
  GitFork,
  RefreshCw,
  FileSpreadsheet,
  UploadCloud,
  FileUp,
  FolderInput,
  DownloadCloud,
  History,
  AlertTriangle,
  LogOut,
  X,
  LayoutDashboard,
  User,
  Tags,
  Layers,
  ChevronDown,
  Settings
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  user: { email: string; role: string; display_name?: string | null } | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
}) => {
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed_sections");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem("sidebar_collapsed_sections", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save sidebar state", e);
      }
      return updated;
    });
  };

  const menuSections = [
    {
      title: "Dữ liệu cơ sở",
      items: [
        { label: "Người dùng", to: "/admin/users", icon: Users },
        { label: "Cố vấn học tập", to: "/admin/advisors", icon: Briefcase },
        { label: "Chương trình đào tạo", to: "/admin/programs", icon: BookOpen },
        { label: "Lớp học", to: "/admin/classes", icon: Building2 },
        { label: "Sinh viên", to: "/admin/students", icon: GraduationCap },
      ],
    },
    {
      title: "Ma trận học thuật",
      items: [
        { label: "Học phần khung", to: "/admin/curriculum_courses", icon: Bookmark },
        { label: "Điều kiện môn học", to: "/admin/course_prerequisites", icon: GitFork },
        { label: "Môn học tương đương", to: "/admin/course_equivalencies", icon: RefreshCw },
        { label: "Kết quả học tập", to: "/admin/student_course_results", icon: FileSpreadsheet },
      ],
    },
    {
      title: "Phiên nhập liệu",
      items: [
        { label: "Nhập chương trình", to: "/admin/curriculum_imports", icon: UploadCloud },
        { label: "Nhập lớp học", to: "/admin/class_imports", icon: FolderInput },
        { label: "Tải bảng điểm lên", to: "/admin/transcript_uploads", icon: FileUp },
      ],
    },
    {
      title: "Xuất dữ liệu",
      items: [
        { label: "Xuất dữ liệu", to: "/admin/exports", icon: DownloadCloud },
        { label: "Lịch sử xuất", to: "/admin/export_logs", icon: History },
      ],
    },
    {
      title: "Cấu hình hệ thống",
      items: [
        { label: "Cảnh báo phân tích", to: "/admin/parse_warnings", icon: AlertTriangle },
        { label: "Cấu hình khớp cột", to: "/admin/column_mappings", icon: FileSpreadsheet },
        { label: "Phân loại môn học", to: "/admin/course_type_mappings", icon: Tags },
        { label: "Khối kiến thức", to: "/admin/knowledge_block_mappings", icon: Layers },
        { label: "Cài đặt", to: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-slate-900/90 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:static lg:flex`}
    >
      {/* Brand/Logo Section */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800/80">
        <Link to="/admin" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-600/30">
            PM
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            PathMinded <span className="text-indigo-400 text-xs font-semibold px-1 py-0.5 rounded bg-indigo-950 border border-indigo-800">Quản trị</span>
          </span>
        </Link>
        <button
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation items list */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <div>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
              }`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={18} />
            <span>Bảng điều khiển</span>
          </NavLink>
        </div>

        {menuSections.map((section) => {
          const isCollapsed = collapsedSections[section.title] !== undefined
            ? collapsedSections[section.title]
            : !section.items.some(item => item.to === location.pathname);
          return (
            <div key={section.title} className="space-y-2">
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-3 text-left group cursor-pointer focus:outline-none"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-300 transition-colors">
                  {section.title}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
                    isCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
              </button>
              
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-125 opacity-100"
                }`}
              >
                <ul className="space-y-1 mt-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                              isActive
                                ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20"
                                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon size={18} className="shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer/User Info Section */}
      <div className="border-t border-slate-800/80 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/45 p-3 border border-slate-800/50">
          <Link
            to="/admin/me"
            className="flex items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200">
              <User size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{user?.display_name || user?.email}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={onLogout}
            title="Đăng xuất"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
