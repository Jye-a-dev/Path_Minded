"use client";

import React from "react";
import { Trash2, CheckCircle } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type: "danger" | "success";
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
        <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
          {isDanger ? (
            <Trash2 className="text-rose-600 h-5 w-5 shrink-0 animate-bounce" />
          ) : (
            <CheckCircle className="text-emerald-600 h-5 w-5 shrink-0" />
          )}
          <h3 className={`text-sm font-extrabold tracking-wide uppercase ${isDanger ? "text-rose-600" : "text-emerald-650"}`}>
            {title}
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-neutral-500 leading-relaxed font-semibold">
            {message}
          </p>
        </div>
        <div className="p-6 border-t border-zinc-150 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-white font-bold cursor-pointer shadow-lg ${
              isDanger 
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/10" 
                : "bg-emerald-600 hover:bg-emerald-55 shadow-emerald-600/10"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
