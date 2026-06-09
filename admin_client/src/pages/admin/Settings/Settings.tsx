import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { useSettings } from "../../../providers/SettingsContext";
import { 
  Settings, 
  Palette, 
  Layout, 
  RotateCcw,
  Sparkles,
  LayoutGrid,
  Check,
  Mail,
  Phone,
  ExternalLink
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();

  // System Settings State (Advisor details, training hotlines)
  const [advisorEmail, setAdvisorEmail] = useState("");
  const [trainingHotline, setTrainingHotline] = useState("");
  const [ascPortalUrl, setAscPortalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data) {
          setAdvisorEmail(res.data.advisor_email || "");
          setTrainingHotline(res.data.training_hotline || "");
          setAscPortalUrl(res.data.asc_portal_url || "");
        }
      } catch (err) {
        console.error("Failed to load system settings:", err);
      }
    };
    void loadSettings();
  }, []);

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setSaveError(null);
    try {
      await api.put("/settings", {
        advisor_email: advisorEmail,
        training_hotline: trainingHotline,
        asc_portal_url: ascPortalUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      console.error("Failed to save system settings:", err);
      setSaveError(apiError.response?.data?.message || "Đã xảy ra lỗi khi lưu cấu hình.");
    } finally {
      setLoading(false);
    }
  };

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
      bgPreview: "bg-[#f8fafc]",
      cardPreview: "bg-white",
      borderPreview: "border-slate-200",
    },
  ];

  const accentColors = [
    { id: "indigo" as const, name: "Xanh chàm (Mặc định)", hex: "#4f46e5", bgClass: "bg-indigo-600" },
    { id: "teal" as const, name: "Xanh ngọc", hex: "#0d9488", bgClass: "bg-teal-600" },
    { id: "violet" as const, name: "Tím hoa cà", hex: "#7c3aed", bgClass: "bg-violet-600" },
    { id: "emerald" as const, name: "Xanh lá cây", hex: "#059669", bgClass: "bg-emerald-600" },
    { id: "rose" as const, name: "Hồng đỏ", hex: "#e11d48", bgClass: "bg-rose-600" },
    { id: "amber" as const, name: "Vàng hổ phách", hex: "#d97706", bgClass: "bg-amber-600" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Header Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 m-0">
            <Settings className="h-8 w-8 animate-spin-slow" style={{ color: "var(--primary-color)" }} />
            Cài đặt hiển thị & giao diện
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Tự do thay đổi màu sắc nút bấm, hình nền giao diện, độ gọn gàng của bảng dữ liệu và hiệu ứng màn hình.
          </p>
        </div>
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer self-start sm:self-center"
        >
          <RotateCcw size={14} />
          Khôi phục ban đầu
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Options Block: Background Theme & Accents */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Background Theme */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={16} style={{ color: "var(--primary-color)" }} />
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
                        ? "bg-slate-955/20"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: "var(--primary-color)",
                            boxShadow: "0 0 12px rgba(var(--primary-rgb), 0.2)",
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

                    <span className="font-bold text-sm text-slate-200 group-hover:text-white transition-colors">
                      {theme.name}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {theme.desc}
                    </span>

                    {isSelected && (
                      <span 
                        className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-xs"
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Palette size={16} style={{ color: "var(--primary-color)" }} />
              2. Màu sắc nhấn nổi bật (Nút bấm, chữ đặc biệt)
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
                        ? "bg-slate-955/20"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: "var(--primary-color)",
                            boxShadow: "0 0 10px rgba(var(--primary-rgb), 0.15)",
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
                    <span className="text-xs font-semibold text-slate-300 group-hover:text-slate-200">
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Student Contact Config (System CRUD) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Settings size={16} style={{ color: "var(--primary-color)" }} />
              3. Cấu hình thông tin liên hệ sinh viên
            </h2>
            <p className="text-xs text-slate-400">
              Quản trị viên có thể thay đổi các thông tin hiển thị trên trang liên hệ Cố vấn học tập của sinh viên.
            </p>

            <form onSubmit={handleSaveSystemSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email CVHT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    Email Phòng CNTT
                  </label>
                  <input
                    type="email"
                    value={advisorEmail}
                    onChange={(e) => setAdvisorEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="e.g. cvht@vlu.edu.vn"
                  />
                </div>

                {/* Hotline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    Hotline Phòng CNTT
                  </label>
                  <input
                    type="text"
                    value={trainingHotline}
                    onChange={(e) => setTrainingHotline(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors"
                    placeholder="e.g. (028) 7109 9221"
                  />
                </div>
              </div>

              {/* ASC Portal URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ExternalLink size={13} className="text-slate-400" />
                  Cổng đào tạo online
                </label>
                <input
                  type="url"
                  value={ascPortalUrl}
                  onChange={(e) => setAscPortalUrl(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-colors"
                  placeholder="e.g. https://asc.vlu.edu.vn"
                />
              </div>

              {saveError && (
                <p className="text-xs text-rose-500 font-semibold">{saveError}</p>
              )}

              <div className="flex justify-end items-center gap-3 pt-2">
                {success && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <Check size={14} /> Lưu cấu hình thành công!
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-indigo-500/10 transition-all disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  {loading ? "Đang lưu..." : "Lưu cấu hình hệ thống"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Options Block: Custom Toggles */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layout size={16} style={{ color: "var(--primary-color)" }} />
              3. Cài đặt hiển thị màn hình
            </h2>

            <div className="space-y-4 divide-y divide-slate-800/60">
              {/* Compact Tables Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex-1 pr-4">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    Bảng hiển thị siêu gọn
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Thu nhỏ khoảng cách các dòng trong bảng để xem được nhiều thông tin hơn cùng lúc.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("compactTables", !settings.compactTables)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.compactTables ? "var(--primary-color)" : "rgba(100, 116, 139, 0.4)"
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
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    Hiệu ứng kính mờ hiện đại
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Làm mờ nền của các bảng điều khiển và thanh công cụ giúp giao diện trông sang trọng hơn.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("glassmorphism", !settings.glassmorphism)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.glassmorphism ? "var(--primary-color)" : "rgba(100, 116, 139, 0.4)"
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
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    Thanh menu dạng tai thỏ
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hiển thị một thanh menu trạng thái bo tròn nằm nổi ở phía trên cùng của trang web.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("showNavbar", !settings.showNavbar)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.showNavbar ? "var(--primary-color)" : "rgba(100, 116, 139, 0.4)"
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
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                    Đèn màu phát sáng mờ ảo
                  </label>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Kích hoạt các khối hào quang phát sáng nhẹ chuyển động mờ ảo phía sau màn hình.
                  </p>
                </div>
                <button
                  onClick={() => updateSetting("meshGradient", !settings.meshGradient)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none"
                  style={{
                    backgroundColor: settings.meshGradient ? "var(--primary-color)" : "rgba(100, 116, 139, 0.4)"
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
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              Ghi chú đồng bộ hóa
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Tất cả các thay đổi sẽ được áp dụng tức thời trên toàn bộ các trang quản trị mà không cần tải lại trang. Các cài đặt này được lưu riêng trên trình duyệt máy tính này của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
