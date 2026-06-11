"use client";

import { useSettings } from "@/providers/SettingsContext";
import {
  Settings,
  Palette,
  Layout,
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Check
} from "lucide-react";

export default function StudentSettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();

  const backgroundThemes = [
    {
      id: "slate" as const,
      name: "Tối mặc định (Màu Đá)",
      desc: "Màu tối cổ điển, dịu nhẹ và dễ chịu khi sử dụng buổi tối.",
      bgPreview: "bg-[#0f172a]",
      cardPreview: "bg-[#1e293b]/40",
      borderPreview: "border-[#334155]/50",
    },
    {
      id: "zinc" as const,
      name: "Đen tuyệt đối (Siêu tối)",
      desc: "Màu đen sâu giúp tiết kiệm pin màn hình và giảm mỏi mắt tối đa.",
      bgPreview: "bg-[#09090b]",
      cardPreview: "bg-[#18181b]/40",
      borderPreview: "border-[#27272a]/50",
    },
    {
      id: "navy" as const,
      name: "Xanh đại dương",
      desc: "Tông màu xanh dương biển sâu mang phong cách công nghệ hiện đại.",
      bgPreview: "bg-[#0B0F19]",
      cardPreview: "bg-[#0D1424]/40",
      borderPreview: "border-[#1E293B]/50",
    },
    {
      id: "emerald" as const,
      name: "Xanh rừng thông",
      desc: "Tông màu xanh lá ngọc lục bảo độc đáo, sang trọng và cá tính.",
      bgPreview: "bg-[#040D0E]",
      cardPreview: "bg-[#061517]/40",
      borderPreview: "border-[#11292B]/50",
    },
    {
      id: "light" as const,
      name: "Sáng thanh lịch (Màu Sáng)",
      desc: "Giao diện nền sáng rõ ràng, thích hợp làm việc ban ngày hoặc nơi sáng.",
      bgPreview: "bg-[#f6f4ef]",
      cardPreview: "bg-white",
      borderPreview: "border-slate-200",
    },
  ];

  const accentColors = [
    { id: "violet" as const, name: "Tím hoa cà (Sinh viên)", hex: "#7c3aed" },
    { id: "indigo" as const, name: "Xanh chàm", hex: "#4f46e5" },
    { id: "emerald" as const, name: "Xanh lá (Cố vấn)", hex: "#059669" },
    { id: "teal" as const, name: "Xanh ngọc", hex: "#0d9488" },
    { id: "rose" as const, name: "Hồng đỏ", hex: "#e11d48" },
    { id: "amber" as const, name: "Vàng hổ phách", hex: "#d97706" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 relative z-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 flex items-center gap-3 m-0">
            <Settings className="h-7 w-7 animate-spin-slow text-violet-600" />
            Cài đặt hiển thị & giao diện
          </h1>
          <p className="text-sm text-neutral-500 mt-1.5">
            Tùy chỉnh màu sắc chủ đề, hình nền cổng, kích thước bảng dữ liệu và các hiệu ứng giao diện của cổng Sinh viên.
          </p>
        </div>
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer self-start sm:self-center select-none shadow-sm"
        >
          <RotateCcw size={14} />
          Khôi phục mặc định
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Left Options Block: Background Theme & Accents */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Background Theme */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={16} className="text-violet-600" />
              1. Lựa chọn hình nền giao diện
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {backgroundThemes.map((theme) => {
                const isSelected = settings.bgTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => updateSetting("bgTheme", theme.id)}
                    className={`flex flex-col text-left rounded-xl p-4 border transition-all cursor-pointer select-none group relative overflow-hidden ${
                      isSelected
                        ? "bg-slate-50 border-violet-600"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-neutral-50/30"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: "var(--primary-color)",
                            boxShadow: "0 0 12px rgba(var(--primary-rgb), 0.15)",
                          }
                        : {}
                    }
                  >
                    {/* Mini Preview Box */}
                    <div className={`h-12 w-full rounded-lg ${theme.bgPreview} border ${theme.borderPreview} p-1.5 flex gap-1.5 mb-3`}>
                      <div className={`w-8 h-full rounded ${theme.cardPreview} border ${theme.borderPreview}`} />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className={`w-3/4 h-1.5 rounded ${theme.cardPreview}`} />
                        <div className={`w-1/2 h-1 rounded ${theme.cardPreview}`} />
                      </div>
                    </div>

                    <span className="font-bold text-sm text-neutral-800 group-hover:text-neutral-900 transition-colors">
                      {theme.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      {theme.desc}
                    </span>

                    {isSelected && (
                      <span
                        className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm"
                        style={{ backgroundColor: "var(--primary-color)" }}
                      >
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Accent Color */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
              <Palette size={16} className="text-violet-600" />
              2. Màu sắc chủ đề (Nút bấm, điểm nhấn, chữ đặc biệt)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {accentColors.map((color) => {
                const isSelected = settings.accentColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => updateSetting("accentColor", color.id)}
                    className={`flex items-center gap-3 rounded-xl p-3 border transition-all cursor-pointer select-none group relative ${
                      isSelected
                        ? "bg-slate-50 border-violet-600"
                        : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-neutral-50/30"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: "var(--primary-color)",
                            boxShadow: "0 0 10px rgba(var(--primary-rgb), 0.1)",
                          }
                        : {}
                    }
                  >
                    <span
                      className="h-6 w-6 rounded-full shrink-0 border border-white/10 flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Options Block: Custom Toggles */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-6 shadow-sm">
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-2">
              <Layout size={16} className="text-violet-600" />
              3. Cấu hình hiển thị màn hình
            </h2>

            <div className="space-y-4 divide-y divide-zinc-100">
              {/* Compact Tables Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex-1 pr-4">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    Bảng hiển thị siêu gọn
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Thu nhỏ khoảng cách các dòng trong bảng để xem được nhiều thông tin hơn cùng lúc.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("compactTables", !settings.compactTables)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.compactTables ? "var(--primary-color, #7c3aed)" : "rgba(100, 116, 139, 0.2)"
                  }}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-250 ease-in-out ${
                      settings.compactTables ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Glassmorphism Toggle */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex-1 pr-4">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    Hiệu ứng kính mờ
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Làm mờ nền của các thanh công cụ và thanh bên giúp giao diện thanh lịch và cao cấp hơn.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("glassmorphism", !settings.glassmorphism)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.glassmorphism ? "var(--primary-color, #7c3aed)" : "rgba(100, 116, 139, 0.2)"
                  }}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-250 ease-in-out ${
                      settings.glassmorphism ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Show notched top navbar */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex-1 pr-4">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    Thanh menu bo góc (Tai thỏ)
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Hiển thị thanh menu trạng thái bo góc nằm nổi mềm mại ở đầu trang.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("showNavbar", !settings.showNavbar)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.showNavbar ? "var(--primary-color, #7c3aed)" : "rgba(100, 116, 139, 0.2)"
                  }}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-250 ease-in-out ${
                      settings.showNavbar ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Background Mesh Gradient Toggle */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex-1 pr-4">
                  <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 cursor-pointer">
                    Hào quang phát sáng nền
                  </label>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Hiển thị các vòm ánh sáng đổi màu chuyển động mờ ảo phía sau giao diện làm việc.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("meshGradient", !settings.meshGradient)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.meshGradient ? "var(--primary-color, #7c3aed)" : "rgba(100, 116, 139, 0.2)"
                  }}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-250 ease-in-out ${
                      settings.meshGradient ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preview Tips */}
          <div className="rounded-2xl border border-zinc-200 bg-neutral-50/50 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              Ghi chú áp dụng giao diện
            </h3>
            <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
              Tất cả các thay đổi về màu sắc, độ tương phản và hình nền sẽ được đồng bộ tức thì trên thiết bị này của bạn mà không cần tải lại trang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
