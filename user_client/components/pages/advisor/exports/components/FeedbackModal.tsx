import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (feedback: string) => Promise<void>;
  studentName: string;
  initialFeedback: string;
  saving: boolean;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSave,
  studentName,
  initialFeedback,
  saving
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setFeedback(initialFeedback || "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialFeedback]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void onSave(feedback);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="p-6 border-b border-zinc-150">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            Nhận xét của Cố vấn
          </h3>
          <p className="text-xs text-neutral-450 mt-1">
            Sinh viên: {studentName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider block">
              Ý kiến / Feedback học thuật của cố vấn
            </label>
            <textarea
              placeholder="Nhập ý kiến nhận xét của bạn về tiến trình học tập của sinh viên này..."
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 resize-none font-semibold text-neutral-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {saving && <Loader2 size={12} className="animate-spin text-white" />}
              Lưu nhận xét
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
