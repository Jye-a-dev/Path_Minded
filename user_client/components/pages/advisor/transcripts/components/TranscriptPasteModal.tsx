import React, { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";

interface TranscriptPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { textContent: string }) => Promise<void>;
  studentLabel: string;
}

export default function TranscriptPasteModal({
  isOpen,
  onClose,
  onSubmit,
  studentLabel
}: TranscriptPasteModalProps) {
  const [textContent, setTextContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim()) {
      setErrorMsg("Vui lòng dán văn bản bảng điểm thô.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSubmit({ textContent });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(error.response?.data?.message || error.message || "Tải lên thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="p-6 border-b border-zinc-150">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            Tải lên bảng điểm sinh viên
          </h3>
          <p className="text-xs text-neutral-550 mt-1 font-bold">
            Mục tiêu: {studentLabel}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-neutral-900 font-semibold text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex gap-2 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-455 uppercase tracking-wider flex justify-between">
              <span>Nội dung văn bản bảng điểm thô</span>
              <span className="text-neutral-400 lowercase font-medium">Sao chép từ Portal VLU</span>
            </label>
            <textarea
              placeholder="Ví dụ:&#10;1&#71;ENG010012&#9;Anh văn dự bị (AV0)&#9;2&#9;&#9;&#9;MT&#10;1&#9;71ENG010000&#9;Kiểm tra tiếng Anh&#9;0&#9;8&#9;3.20&#9;B+"
              rows={6}
              required
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500 font-mono resize-none h-44 font-semibold text-neutral-800"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-50"
            >
              {submitting && <Loader2 size={12} className="animate-spin text-white" />}
              Phân tích bảng điểm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
