"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70svh] w-full items-center justify-center px-6 relative bg-[#f6f4ef]">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-red-500/10 blur-[100px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-200/80 bg-white p-8 text-center shadow-2xl backdrop-blur-xl hover:shadow-red-500/5 transition-shadow duration-500">
        {/* Top visual warning */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-100 text-red-500 shadow-inner animate-bounce-slow">
            <ShieldAlert size={36} />
          </div>
        </div>

        {/* Text descriptions */}
        <h1 className="text-2xl font-black tracking-tight text-neutral-950">
          Quyền truy cập bị hạn chế
        </h1>
        <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-1.5">
          Lỗi 403 - Forbidden
        </p>
        
        <p className="mt-4 text-sm text-neutral-500 leading-relaxed">
          Tài khoản hiện tại của bạn không có đủ thẩm quyền truy cập vào phân khu này. Vui lòng chuyển đổi tài khoản phù hợp hoặc quay lại trang cá nhân của bạn.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/me"
            className="flex items-center justify-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-neutral-950/20 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <ArrowLeft size={16} />
            Hồ sơ cá nhân
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-350 bg-white hover:bg-neutral-50 px-6 py-3.5 text-sm font-semibold text-neutral-700 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home size={16} />
            Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
