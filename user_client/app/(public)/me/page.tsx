"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle,
  LogOut,
  Loader2,
} from "lucide-react";

export default function Me() {
  const { token, login, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/me");
        if (response.data) {
          setEmail(response.data.email);
          setDisplayName(response.data.display_name || "");
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setError("Không thể tải thông tin tài khoản học viên.");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (password && password.length < 6) {
      setError("Mật khẩu mới phải từ 6 ký tự trở lên.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
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
      setSuccess("Cập nhật thông tin tài khoản thành công!");
      setPassword("");
      setConfirmPassword("");

      // Update auth context state instantly
      if (typeof window !== "undefined") {
        const refreshToken =
          localStorage.getItem("user_refresh_token") ||
          sessionStorage.getItem("user_refresh_token") ||
          "";
        const remember = localStorage.getItem("user_remember") === "true";
        if (response.data) {
          login(token || "", refreshToken, response.data, remember);
        }
      }
    } catch (err) {
      console.error("Profile update failed:", err);
      const errObj = err as { response?: { data?: { message?: string } } };
      setError(
        errObj.response?.data?.message ||
          "Không thể cập nhật thông tin. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-[#f6f4ef]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6 relative w-full bg-[#f6f4ef]">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-87.5 w-125 rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Page Title */}
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Thông tin cá nhân</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cập nhật thông tin liên hệ và bảo mật cho tài khoản học tập của bạn.
        </p>
      </div>

      {/* Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col items-center space-y-4 border-b border-zinc-100 pb-6 text-center sm:flex-row sm:space-y-0 sm:space-x-6 sm:text-left">
          {/* Circular Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-violet-50 text-violet-600 text-3xl font-bold shadow-inner">
            {displayName ? (
              displayName.charAt(0).toUpperCase()
            ) : email ? (
              email.charAt(0).toUpperCase()
            ) : (
              <UserIcon size={36} />
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-zinc-950">{displayName || email}</h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600 border border-violet-100">
                <Shield size={12} />
                Học viên portal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-100">
                Đang kích hoạt
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="mt-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg bg-red-50 p-3.5 text-sm text-red-600 border border-red-200">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3.5 text-sm text-emerald-600 border border-emerald-200">
              <CheckCircle size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Display Name Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Họ và tên
              </label>
              <div className="relative">
                <UserIcon className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-2 border-t border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">Thiết lập mật khẩu mới</h3>
              <p className="text-xs text-zinc-400">
                Không điền nếu bạn không muốn thay đổi mật khẩu hiện tại.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <KeyRound className="absolute top-2.5 left-3 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 focus:outline-none transition-all"
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
              className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-violet-600 disabled:pointer-events-none disabled:opacity-50 transition-all cursor-pointer w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-6 py-2.5 text-sm font-semibold text-zinc-700 transition-all cursor-pointer w-full sm:w-auto"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
