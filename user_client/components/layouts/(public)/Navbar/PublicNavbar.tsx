"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BaseNavbar from "@/components/layouts/@base/Navbar/BaseNavbar";
import { User, LogOut, Loader2 } from "lucide-react";

export default function PublicNavbar() {
  const { isAuthenticated, logout, loading, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <BaseNavbar
      brand={
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-neutral-900 hover:opacity-80 transition"
        >
          Path<span className="text-violet-600">Minded</span>
        </Link>
      }
      action={
        loading ? (
          <div className="flex h-10 w-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link
              href="/me"
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition"
            >
              <User size={16} />
              <span>{user?.display_name || user?.email || "Cá nhân"}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Đăng nhập
          </Link>
        )
      }
    />
  );
}
