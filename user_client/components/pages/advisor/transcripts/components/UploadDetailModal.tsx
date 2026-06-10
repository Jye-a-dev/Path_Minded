import React, { useState } from "react";
import { X, GraduationCap, AlertCircle } from "lucide-react";
import { UploadSession } from "../index";

interface UploadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUpload: UploadSession | null;
}

export default function UploadDetailModal({
  isOpen,
  onClose,
  selectedUpload
}: UploadDetailModalProps) {
  const [detailTab, setDetailTab] = useState<"results" | "json" | "raw">("results");

  if (!isOpen || !selectedUpload) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 text-neutral-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={16} />
        </button>
        <div className="p-6 border-b border-zinc-150 shrink-0">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <GraduationCap className="text-emerald-650" size={22} />
            Chi tiết kết quả bóc tách phiên
          </h3>
          <p className="text-xs text-neutral-450 mt-1 font-mono">
            Phiên: {selectedUpload.id} — Tải lên vào {new Date(selectedUpload.uploaded_at).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {selectedUpload.parsed_json?.warnings && selectedUpload.parsed_json.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-255 space-y-2">
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <AlertCircle size={14} /> Cảnh báo bóc tách ({selectedUpload.parsed_json.warnings.length})
              </span>
              <div className="text-[10px] text-amber-700 divide-y divide-amber-100 max-h-24 overflow-y-auto font-medium">
                {selectedUpload.parsed_json.warnings.map((w, idx) => (
                  <p key={idx} className="py-1">
                    Dòng {w.rowNumber || "?"}: {w.message} {w.rawValue ? `(Giá trị: "${w.rawValue}")` : ""}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex border-b border-zinc-200 gap-2 shrink-0 font-bold">
            <button
              onClick={() => setDetailTab("results")}
              className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                detailTab === "results"
                  ? "border-emerald-600 text-emerald-800"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Kết quả môn học
            </button>
            <button
              onClick={() => setDetailTab("json")}
              className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                detailTab === "json"
                  ? "border-emerald-600 text-emerald-800"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Dữ liệu JSON phân tích
            </button>
            <button
              onClick={() => setDetailTab("raw")}
              className={`px-4 py-2 text-xs border-b-2 transition-colors cursor-pointer ${
                detailTab === "raw"
                  ? "border-emerald-600 text-emerald-800"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Văn bản thô
            </button>
          </div>

          <div className="min-h-60 flex-1">
            {detailTab === "results" && (
              <div className="space-y-4">
                {selectedUpload.parse_error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-mono">
                    <strong>Lỗi phân tích:</strong> {selectedUpload.parse_error}
                  </div>
                )}

                {!selectedUpload.parsed_json?.results || selectedUpload.parsed_json.results.length === 0 ? (
                  <div className="text-center py-10 text-neutral-450 text-xs font-semibold bg-neutral-50/50 rounded-xl">
                    Không có kết quả môn học nào được tìm thấy hoặc phiên bóc tách lỗi.
                  </div>
                ) : (
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-neutral-400 font-bold text-[9px] uppercase tracking-wider">
                          <th className="px-4 py-2.5">Học kỳ</th>
                          <th className="px-4 py-2.5">Mã môn</th>
                          <th className="px-4 py-2.5">Tên học phần</th>
                          <th className="px-4 py-2.5 text-center">Tín chỉ</th>
                          <th className="px-4 py-2.5 text-center">Hệ 10</th>
                          <th className="px-4 py-2.5 text-center">Hệ 4</th>
                          <th className="px-4 py-2.5 text-center">Điểm chữ</th>
                          <th className="px-4 py-2.5">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-neutral-700 font-medium">
                        {selectedUpload.parsed_json.results.map((res, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/20">
                            <td className="px-4 py-2.5 font-mono text-[10px] text-neutral-450">
                              {res.schoolYear === "Bảo lưu" ? (
                                <span className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-600 border border-zinc-200">Bảo lưu</span>
                              ) : (
                                `${res.schoolYear} - HK${res.semesterNumber}`
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-bold text-neutral-900">{res.courseCode}</td>
                            <td className="px-4 py-2.5 truncate max-w-37.5">{res.courseName || "—"}</td>
                            <td className="px-4 py-2.5 text-center font-mono">{res.credits ?? 0}</td>
                            <td className="px-4 py-2.5 text-center font-mono">{res.score10 !== null && res.score10 !== undefined ? res.score10 : "—"}</td>
                            <td className="px-4 py-2.5 text-center font-mono">{res.score4 !== null && res.score4 !== undefined ? res.score4 : "—"}</td>
                            <td className="px-4 py-2.5 text-center font-mono font-bold text-emerald-700">{res.letterGrade || "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                                res.status === "PASSED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                res.status === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-neutral-100 text-neutral-450"
                              }`}>
                                {res.status === "PASSED" ? "ĐẠT" : res.status === "FAILED" ? "TRƯỢT" : "ĐANG HỌC"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {detailTab === "json" && (
              <pre className="bg-neutral-50 p-4 rounded-xl text-xs overflow-auto font-mono text-emerald-800 max-h-96 border border-zinc-200">
                {JSON.stringify(selectedUpload.parsed_json || { message: "Không có dữ liệu JSON" }, null, 2)}
              </pre>
            )}

            {detailTab === "raw" && (
              <pre className="bg-neutral-50 p-4 rounded-xl text-xs overflow-auto font-mono text-neutral-700 max-h-96 whitespace-pre-wrap border border-zinc-200 leading-relaxed font-semibold">
                {selectedUpload.raw_text}
              </pre>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-150 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-100 hover:bg-neutral-200 px-4 py-2 text-xs font-bold text-neutral-750 transition cursor-pointer"
          >
            Đóng chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
