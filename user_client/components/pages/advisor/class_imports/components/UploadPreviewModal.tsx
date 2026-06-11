"use client";

import React from "react";
import {
  X,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { ParsedStudentItem, WarningItem } from "../types";

interface UploadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  file: File | null;
  setFile: (file: File | null) => void;
  textContent: string;
  setTextContent: (text: string) => void;
  uploadNote: string;
  setUploadNote: (note: string) => void;
  sourceType: "file" | "text";
  setSourceType: (type: "file" | "text") => void;
  isUploading: boolean;
  previewData: ParsedStudentItem[] | null;
  previewWarnings: WarningItem[];
  selectedPreviewCodes: Set<string>;
  setSelectedPreviewCodes: React.Dispatch<React.SetStateAction<Set<string>>>;
  submittingPreview: boolean;
  handleStartImport: (e: React.FormEvent) => void;
  handleCancelPreview: () => void;
  handleConfirmPreview: () => void;
}

export default function UploadPreviewModal({
  isOpen,
  onClose,
  classId,
  setFile,
  textContent,
  setTextContent,
  uploadNote,
  setUploadNote,
  sourceType,
  setSourceType,
  isUploading,
  previewData,
  previewWarnings,
  selectedPreviewCodes,
  setSelectedPreviewCodes,
  submittingPreview,
  handleStartImport,
  handleCancelPreview,
  handleConfirmPreview,
}: UploadPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className={`bg-white border border-zinc-200 w-full rounded-2xl shadow-xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${
        previewData ? "max-w-4xl" : "max-w-md"
      }`}>
        <button
          onClick={previewData ? handleCancelPreview : onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-6 border-b border-zinc-150 shrink-0">
          <h3 className="text-sm font-extrabold text-neutral-900 tracking-wide uppercase">
            {previewData ? "Xem trước danh sách bóc tách sinh viên" : "Phiên nhập danh sách sinh viên mới"}
          </h3>
          <p className="text-[10px] text-neutral-455 uppercase font-mono tracking-wide mt-0.5">
            Nhóm lớp: {classId}
          </p>
        </div>

        {previewData ? (
          // ──────── Preview Screen ────────
          <div className="flex-1 overflow-y-auto p-6 space-y-4 font-semibold text-xs text-neutral-600">
            {previewWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-250 bg-amber-50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle size={14} />
                  <span>Cảnh báo định dạng ({previewWarnings.length})</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] text-amber-700 leading-relaxed font-mono">
                  {previewWarnings.slice(0, 5).map((w, idx) => (
                    <li key={idx}>Dòng {w.rowNumber ?? "—"}: {w.message} (Gốc: {w.rawValue})</li>
                  ))}
                  {previewWarnings.length > 5 && <li>Và {previewWarnings.length - 5} cảnh báo khác...</li>}
                </ul>
              </div>
            )}

            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-neutral-400 font-bold text-[9px] uppercase tracking-wider">
                    <th className="px-4 py-2 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedPreviewCodes.size === previewData.length}
                        onChange={() => {
                          if (selectedPreviewCodes.size === previewData.length) {
                            setSelectedPreviewCodes(new Set());
                          } else {
                            setSelectedPreviewCodes(new Set(previewData.map((s) => s.studentCode)));
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-2">Mã số sinh viên</th>
                    <th className="px-4 py-2">Họ và tên</th>
                    <th className="px-4 py-2">Email học thuật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-neutral-700">
                  {previewData.map((s) => {
                    const isChecked = selectedPreviewCodes.has(s.studentCode);
                    return (
                      <tr key={s.studentCode} className="hover:bg-neutral-50/20">
                        <td className="px-4 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = new Set(selectedPreviewCodes);
                              if (next.has(s.studentCode)) next.delete(s.studentCode);
                              else next.add(s.studentCode);
                              setSelectedPreviewCodes(next);
                            }}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2 font-mono font-bold text-neutral-900">{s.studentCode}</td>
                        <td className="px-4 py-2 font-bold">{s.fullName}</td>
                        <td className="px-4 py-2 font-mono text-[11px] text-neutral-450">{s.email || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
              <button
                type="button"
                onClick={handleCancelPreview}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-550 font-bold cursor-pointer"
              >
                Hủy bỏ phiên
              </button>
              <button
                type="button"
                disabled={selectedPreviewCodes.size === 0 || submittingPreview}
                onClick={handleConfirmPreview}
                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
              >
                {submittingPreview && <Loader2 size={12} className="animate-spin text-white" />}
                Lưu {selectedPreviewCodes.size} hồ sơ vào DB
              </button>
            </div>
          </div>
        ) : (
          // ──────── Upload Form Screen ────────
          <form onSubmit={handleStartImport} className="p-6 space-y-5 text-neutral-900 font-semibold text-xs flex-1 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Hình thức nhập</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSourceType("file")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                    sourceType === "file" 
                      ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                      : "border-zinc-200 hover:bg-neutral-50 text-neutral-500"
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  Tải tệp Excel
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("text")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-bold transition cursor-pointer ${
                    sourceType === "text" 
                      ? "bg-emerald-50 border-emerald-250 text-emerald-700"
                      : "border-zinc-200 hover:bg-neutral-50 text-neutral-555"
                  }`}
                >
                  <FileText size={14} />
                  Dán văn bản
                </button>
              </div>
            </div>

            {sourceType === "file" ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Tệp bảng tính Excel (.xls, .xlsx)</label>
                <input
                  type="file"
                  required
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                  }}
                  className="w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-bold hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Dán văn bản danh sách thô</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Định dạng: MSSV,Họ tên,Email (mỗi dòng 1 sinh viên)"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-none h-32"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Ghi chú phiên nhập</label>
              <input
                type="text"
                placeholder="Ví dụ: Danh sách sinh viên chuyển lớp đợt 1..."
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 border border-zinc-250 bg-white hover:bg-neutral-50 text-neutral-555 font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-55 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/10 disabled:opacity-55"
              >
                {isUploading && <Loader2 size={12} className="animate-spin text-white" />}
                Bắt đầu bóc tách
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
