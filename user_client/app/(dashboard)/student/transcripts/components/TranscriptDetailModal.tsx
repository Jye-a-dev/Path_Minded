import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { UploadSession, ParsedResult, ParsedWarning } from "./UploadHistoryTable";

interface TranscriptDetailModalProps {
  upload: UploadSession | null;
  onClose: () => void;
}

export function TranscriptDetailModal({
  upload,
  onClose,
}: TranscriptDetailModalProps) {
  const [detailTab, setDetailTab] = useState<"results" | "warnings" | "raw">("results");

  if (!upload) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-zinc-200 max-w-4xl w-full p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
        <div className="flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">
              Chi tiết phân tích bảng điểm
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              ID: {upload.id} · Tải lên{" "}
              {new Date(upload.uploaded_at).toLocaleString("vi-VN")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-neutral-700 text-xs font-bold rounded-lg bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Đóng ✕
          </button>
        </div>

        {/* Detail tabs */}
        <div className="flex border-b border-zinc-200 gap-1 shrink-0">
          {(["results", "warnings", "raw"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                detailTab === tab
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-800"
              }`}
            >
              {tab === "results"
                ? `Kết quả môn học (${upload.parsed_json?.results?.length ?? 0})`
                : tab === "warnings"
                  ? `Cảnh báo (${upload.parsed_json?.warnings?.length ?? 0})`
                  : "Văn bản gốc"}
            </button>
          ))}
        </div>

        {/* Detail content */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {detailTab === "results" && (
            <div className="space-y-3">
              {upload.parse_error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-mono">
                  <strong>Lỗi phân tích:</strong> {upload.parse_error}
                </div>
              )}
              {upload.parsed_json?.results?.length ? (
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                        <th className="p-3">Học kỳ</th>
                        <th className="p-3">Mã môn</th>
                        <th className="p-3">Tên môn học</th>
                        <th className="p-3 text-center">TC</th>
                        <th className="p-3 text-center">Hệ 10</th>
                        <th className="p-3 text-center">Hệ 4</th>
                        <th className="p-3 text-center">Chữ</th>
                        <th className="p-3">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {upload.parsed_json.results.map(
                        (res: ParsedResult, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/60 text-neutral-700"
                          >
                            <td className="p-3 text-neutral-400 font-medium">
                              {res.schoolYear === "Bảo lưu" ? (
                                <span className="inline-flex items-center rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 border border-zinc-200">
                                  Bảo lưu
                                </span>
                              ) : (
                                `${res.schoolYear} HK${res.semesterNumber}`
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-violet-600">
                              {res.courseCode}
                            </td>
                            <td className="p-3 font-medium text-neutral-800">
                              {res.courseName || "N/A"}
                            </td>
                            <td className="p-3 text-center text-neutral-500">
                              {res.credits ?? 0}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {res.score10 ?? "—"}
                            </td>
                            <td className="p-3 text-center font-mono">
                              {res.score4 ?? "—"}
                            </td>
                            <td className="p-3 text-center font-mono font-bold">
                              {res.letterGrade || "—"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  res.status === "PASSED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : res.status === "FAILED"
                                      ? "bg-red-50 text-red-600 border-red-100"
                                      : "bg-neutral-100 text-neutral-500 border-neutral-200"
                                }`}
                              >
                                {res.status === "PASSED"
                                  ? "Đạt"
                                  : res.status === "FAILED"
                                    ? "Rớt"
                                    : "Đang học"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  Không có kết quả môn học được nhận diện.
                </div>
              )}
            </div>
          )}

          {detailTab === "warnings" && (
            <div className="space-y-2">
              {upload.parsed_json?.warnings?.length ? (
                upload.parsed_json.warnings.map(
                  (warn: ParsedWarning, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 text-xs flex gap-2.5"
                    >
                      <AlertCircle
                        size={15}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                      <div className="space-y-1">
                        <p className="font-bold text-neutral-800">
                          Dòng {warn.rowNumber ?? "?"}: {warn.message}
                        </p>
                        {warn.rawValue && (
                          <p className="font-mono text-[10px] text-neutral-400 bg-white px-2 py-1 rounded border">
                            {warn.rawValue}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  Không có cảnh báo dòng nào trong phiên này.
                </div>
              )}
            </div>
          )}

          {detailTab === "raw" && (
            <pre className="bg-neutral-50 p-4 rounded-xl text-xs overflow-auto font-mono text-neutral-600 whitespace-pre-wrap border border-zinc-200 max-h-96">
              {upload.raw_text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
