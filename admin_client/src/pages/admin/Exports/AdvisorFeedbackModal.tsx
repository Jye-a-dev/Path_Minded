import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface AdvisorFeedbackModalProps {
  isOpen: boolean;
  studentName: string;
  initialFeedback: string;
  onClose: () => void;
  onSave: (feedback: string) => Promise<void>;
  saving: boolean;
}

export const AdvisorFeedbackModal: React.FC<AdvisorFeedbackModalProps> = ({
  isOpen,
  studentName,
  initialFeedback,
  onClose,
  onSave,
  saving,
}) => {
  const [feedback, setFeedback] = useState(initialFeedback);

  // Synchronize state when initialFeedback changes or modal opens using key pattern in parent
  // No useEffect needed for state sync here to prevent cascading render warnings

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(feedback);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-xl border-2 border-black bg-white p-6 shadow-2xl relative text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <h3 className="text-sm font-black text-black tracking-wide uppercase">
            Ý kiến Feedback của GVHT
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-black hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-xs text-black font-semibold">
            Sinh viên: <span className="font-black underline text-black">{studentName}</span>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-black uppercase tracking-wider block">
              Ý kiến phản hồi / Nhận xét của cố vấn
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ví dụ: Đủ điều kiện tốt nghiệp, nợ môn học đại cương..."
              rows={4}
              className="w-full rounded-lg border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder-slate-500 focus:border-indigo-650 focus:outline-none transition-all resize-none font-medium"
              autoFocus
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-black text-black hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#ffd54f] hover:bg-[#ffca28] disabled:opacity-50 px-4 py-2 text-xs font-black text-black shadow-md transition cursor-pointer"
            >
              {saving && <Loader2 size={12} className="animate-spin text-black" />}
              Lưu nhận xét
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
