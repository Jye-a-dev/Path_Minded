import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/services/api";

interface TranscriptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onSuccess: () => void;
}

export function TranscriptUploadModal({
  isOpen,
  onClose,
  studentId,
  onSuccess,
}: TranscriptUploadModalProps) {
  const [uploadSourceType, setUploadSourceType] = useState<"text" | "file">("text");
  const [uploadText, setUploadText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadSourceType === "file" && !uploadFile) {
      setUploadError("Vui lòng chọn tệp bảng điểm Excel (.xls, .xlsx).");
      return;
    }
    if (uploadSourceType === "text" && !uploadText.trim()) {
      setUploadError("Vui lòng sao chép và dán nội dung bảng điểm.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("sourceType", uploadSourceType);
      formData.append("studentId", studentId);
      if (uploadSourceType === "file" && uploadFile) {
        formData.append("file", uploadFile);
      } else {
        formData.append("textContent", uploadText);
      }
      await api.post("/transcript_uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadFile(null);
      setUploadText("");
      onSuccess();
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setUploadError(
        e.response?.data?.message ||
          e.message ||
          "Xử lý bảng điểm thất bại."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div>
          <h2 className="text-lg font-bold text-neutral-950">
            Nhập bảng điểm mới
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Dán dữ liệu từ cổng đào tạo ASC/Edusoft hoặc tải tệp Excel bảng điểm lên.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {uploadError && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
              {uploadError}
            </div>
          )}

          {/* Source type toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Phương thức nhập
            </label>
            <div className="flex bg-neutral-100 p-1 rounded-xl gap-1">
              {(["text", "file"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUploadSourceType(type)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                    uploadSourceType === type
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {type === "text" ? "📋 Dán văn bản" : "📁 Tệp Excel (.xlsx)"}
                </button>
              ))}
            </div>
          </div>

          {uploadSourceType === "text" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Nội dung bảng điểm
              </label>
              <textarea
                required
                placeholder="Sao chép toàn bộ bảng điểm từ cổng đào tạo và dán vào đây..."
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                className="w-full h-48 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-neutral-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-mono resize-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Chọn tệp Excel
              </label>
              <input
                type="file"
                required
                accept=".xls,.xlsx"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-neutral-900 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 px-5 py-2.5 text-xs font-semibold text-neutral-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {uploading ? "Đang xử lý..." : "Xác nhận & Phân tích"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
