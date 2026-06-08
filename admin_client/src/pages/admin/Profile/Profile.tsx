import React, { useState, useEffect } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { api } from "../../../services/api";
import { User, Mail, Shield, KeyRound, AlertCircle, CheckCircle, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { token, login, logout } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/me");
        if (response.data) {
          setEmail(response.data.email);
          setDisplayName(response.data.display_name || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Không thể tải thông tin cá nhân.");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Vui lòng điền địa chỉ email.");
      return;
    }

    if (password && password.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const payload: { email: string; display_name: string; password?: string } = {
        email,
        display_name: displayName,
      };
      if (password) {
        payload.password = password;
      }

      const response = await api.patch("/users/me", payload);
      setSuccess("Cập nhật thông tin cá nhân thành công!");
      setPassword("");
      setConfirmPassword("");

      // Update auth context state instantly
      const refreshToken = localStorage.getItem("admin_refresh_token") || sessionStorage.getItem("admin_refresh_token") || "";
      const remember = localStorage.getItem("admin_remember") === "true";
      if (response.data) {
        login(token || "", refreshToken, response.data, remember);
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(errObj.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (fetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Tài khoản của tôi</h1>
        <p className="text-sm text-slate-400">
          Xem thông tin cá nhân và thiết lập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-[50px] pointer-events-none" />

        <div className="flex flex-col items-center space-y-4 border-b border-slate-800/80 pb-6 text-center sm:flex-row sm:space-y-0 sm:space-x-6 sm:text-left">
          {/* Large Avatar */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-3xl font-semibold shadow-inner">
            {displayName ? displayName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : <User size={36} />)}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{displayName || email}</h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                <Shield size={12} />
                Quản trị viên
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                Ủy quyền hợp lệ
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="mt-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg bg-rose-500/10 p-3.5 text-sm text-rose-400 border border-rose-500/25">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 p-3.5 text-sm text-emerald-400 border border-emerald-500/25">
              <CheckCircle size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Display Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Section Title */}
            <div className="pt-2 border-t border-slate-800/80">
              <h3 className="text-sm font-semibold text-white">Đổi mật khẩu mới</h3>
              <p className="text-xs text-slate-500">Để trống nếu không có nhu cầu thay đổi mật khẩu.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between sm:items-center">
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu thay đổi...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-rose-950/20 hover:border-rose-900/50 hover:text-rose-400 px-6 py-2.5 text-sm font-semibold text-slate-300 transition-all cursor-pointer w-full sm:w-auto"
            >
              <LogOut size={16} />
              Đăng xuất tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
