"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Building,
  KeyRound,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogOut
} from "lucide-react";

interface AdvisorProfile {
  id: string;
  user_id: string;
  full_name: string;
  department: string | null;
  email?: string | null;
}

export default function AdvisorProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile forms
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Account forms
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);
  const [accountError, setAccountError] = useState("");

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const res = await api.get(`/advisors?user_id=${user.id}`);
        if (isMounted) {
          if (res.data && res.data.length > 0) {
            const prof = res.data[0];
            setProfile(prof);
            setFullName(prof.full_name || "");
            setDepartment(prof.department || "");
          }
          setEmail(user.email || "");
          setDisplayName(user.display_name || "");
        }
      } catch (err) {
        console.error("Failed to load advisor profile settings:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setProfileSaving(true);
    setProfileSuccess(false);
    setProfileError("");

    try {
      await api.patch(`/advisors/${profile.id}`, {
        full_name: fullName.trim(),
        department: department.trim() || null
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setProfileError(error.response?.data?.message || "Lỗi cập nhật hồ sơ cố vấn");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setAccountError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setAccountSaving(true);
    setAccountSuccess(false);
    setAccountError("");

    const payload: { email: string; display_name: string | null; password?: string } = {
      email: email.trim(),
      display_name: displayName.trim() || null
    };

    if (password) {
      payload.password = password;
    }

    try {
      await api.patch("/users/me", payload);
      setAccountSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setAccountSuccess(false), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAccountError(error.response?.data?.message || "Lỗi cập nhật thông tin tài khoản");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải thông tin cá nhân...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
          <User size={12} />
          <span>Hồ sơ Cố vấn</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Tài khoản của tôi
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Quản lý thông tin cá nhân, cập nhật học hàm/khoa công tác và thay đổi mật khẩu tài khoản.
        </p>
      </div>

      {/* User Quick Info Card like Admin Profile */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-250 bg-white p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />

        <div className="flex flex-col items-center space-y-4 border-b border-zinc-150 pb-6 text-center sm:flex-row sm:space-y-0 sm:space-x-6 sm:text-left">
          {/* Large Avatar */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-50 text-emerald-600 text-3xl font-semibold shadow-inner">
            {fullName ? fullName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <User size={36} />)}
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-neutral-900">{fullName || displayName || user?.email}</h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-500/20">
                <Shield size={12} />
                Cố vấn học tập
              </span>
              {department && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-500/20">
                  <Building size={12} />
                  Khoa {department}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic content grid forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Profile Card */}
          <div className="flex flex-col justify-between">
            <div className="pb-4 border-b border-zinc-150">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <User size={16} className="text-emerald-600" />
                Thông tin Cố vấn học tập
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Cập nhật thông tin định danh phục vụ hoạt động cố vấn và giáo vụ.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="py-4 space-y-4 flex-1">
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-250 text-red-700 rounded-xl text-xs flex gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl text-xs flex gap-2">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>Lưu thông tin cố vấn thành công!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Họ và tên Cố vấn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Khoa / Ban phụ trách
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Công nghệ thông tin"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-xl px-5 py-2.5 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thông tin cố vấn"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Account Card */}
          <div className="flex flex-col justify-between">
            <div className="pb-4 border-b border-zinc-150">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <KeyRound size={16} className="text-emerald-600" />
                Tài khoản &amp; Bảo mật
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Thiết lập địa chỉ email liên hệ, tên hiển thị và mật khẩu truy cập.
              </p>
            </div>

            <form onSubmit={handleUpdateAccount} className="py-4 space-y-4 flex-1">
              {accountError && (
                <div className="p-3 bg-red-50 border border-red-250 text-red-700 rounded-xl text-xs flex gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{accountError}</span>
                </div>
              )}
              {accountSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl text-xs flex gap-2">
                  <CheckCircle size={15} className="shrink-0" />
                  <span>Cập nhật tài khoản thành công!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tên hiển thị tài khoản
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    placeholder="Để trống nếu không đổi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    placeholder="Để trống nếu không đổi"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="rounded-xl px-5 py-2.5 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
                >
                  {accountSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Cập nhật tài khoản"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Profile Footer Panel */}
        <div className="border-t border-zinc-150 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-neutral-400 leading-relaxed font-medium">
            Tài khoản của bạn được cấp vai trò bảo mật <strong className="text-emerald-700 uppercase">{user?.role}</strong>. Cố vấn có quyền quản lý sinh viên và nhập khung đào tạo.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-5 py-2.5 text-xs font-bold transition cursor-pointer select-none"
          >
            <LogOut size={14} />
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}
