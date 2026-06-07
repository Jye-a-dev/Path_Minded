"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
} from "lucide-react";

interface StudentProfile {
  id: string;
  student_code: string;
  full_name: string;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  has_grades?: boolean;
}

interface ParsedResult {
  schoolYear?: string;
  semesterNumber?: number;
  courseCode?: string;
  courseName?: string;
  credits?: number;
  score10?: number | null;
  score4?: number | null;
  letterGrade?: string | null;
  status?: string;
}

interface ParsedWarning {
  rowNumber?: number;
  message?: string;
  rawValue?: string;
}

interface UploadSession {
  id: string;
  student_id: string;
  raw_text: string;
  source_type: "FILE" | "PASTE";
  parse_status: "PENDING" | "SUCCESS" | "FAILED";
  parse_error?: string | null;
  uploaded_at: string;
  parsed_at?: string | null;
  parsed_json?: {
    results?: ParsedResult[];
    warnings?: ParsedWarning[];
  } | null;
}

export default function StudentTranscriptsPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [uploads, setUploads] = useState<UploadSession[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);

  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [uploadSourceType, setUploadSourceType] = useState<"text" | "file">("text");
  const [uploadText, setUploadText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [selectedUpload, setSelectedUpload] = useState<UploadSession | null>(null);
  const [detailTab, setDetailTab] = useState<"results" | "warnings" | "raw">("results");
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch upload history (reused by submit / delete handlers) ─
  const fetchUploads = useCallback(async (profile: StudentProfile) => {
    setLoadingUploads(true);
    try {
      const res = await api.get(`/transcript_uploads?student_id=${profile.id}&limit=100`);
      setUploads(res.data || []);
    } catch (err) {
      console.error("Failed to fetch uploads:", err);
    } finally {
      setLoadingUploads(false);
    }
  }, []);

  // ── Fetch student profile + uploads in one effect ────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingStudent(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) {
          const profile: StudentProfile = res.data[0];
          setStudentProfile(profile);
          await fetchUploads(profile);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoadingStudent(false);
      }
    };
    void load();
  }, [user, fetchUploads]);

  // ── Submit upload ────────────────────────────────────────────
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;
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
      formData.append("studentId", studentProfile.id);
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
      setUploadFormOpen(false);
      await fetchUploads(studentProfile);
      const studentRes = await api.get(`/students/${studentProfile.id}`);
      if (studentRes.data) setStudentProfile(studentRes.data);
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

  // ── Delete session ───────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteSessionId || !studentProfile) return;
    setDeleting(true);
    try {
      await api.delete(`/transcript_uploads/${deleteSessionId}`);
      setDeleteSessionId(null);
      await fetchUploads(studentProfile);
      const studentRes = await api.get(`/students/${studentProfile.id}`);
      if (studentRes.data) setStudentProfile(studentRes.data);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Loading / no profile states ──────────────────────────────
  if (loadingStudent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Chưa liên kết hồ sơ</h1>
        <p className="text-sm text-neutral-500">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ sinh viên.
          Vui lòng liên hệ CVHT để được hỗ trợ.
        </p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
            <FileSpreadsheet size={12} />
            <span>Bảng điểm & Transcript</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Quản lý Bảng điểm
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tải lên tệp Excel hoặc dán văn bản từ cổng đào tạo. Hệ thống tự động bóc tách và phân tích các học phần.
          </p>
        </div>
        <button
          onClick={() => {
            setUploadError(null);
            setUploadFormOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Nhập bảng điểm mới
        </button>
      </div>

      {/* Upload history */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        {loadingUploads ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-500 text-sm">
            <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
            Đang tải lịch sử...
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-300">
              <FileSpreadsheet size={26} />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">
              Chưa có bảng điểm nào
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Nhấn &ldquo;Nhập bảng điểm mới&rdquo; để tải lên hoặc dán dữ
              liệu bảng điểm từ cổng đào tạo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-neutral-400 border-b border-zinc-200 font-bold text-[10px] uppercase tracking-wider">
                  <th className="px-5 py-3.5">Thời gian tải lên</th>
                  <th className="px-5 py-3.5">Phương thức</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5">Lỗi phân tích</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {uploads.map((upload) => (
                  <tr
                    key={upload.id}
                    className="hover:bg-violet-50/30 text-neutral-700 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-neutral-500 text-xs">
                      {new Date(upload.uploaded_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold text-neutral-600 uppercase">
                        {upload.source_type === "FILE" ? (
                          <>
                            <Upload size={10} /> Tệp tin
                          </>
                        ) : (
                          <>
                            <FileText size={10} /> Văn bản
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold border ${
                          upload.parse_status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : upload.parse_status === "FAILED"
                              ? "bg-red-50 text-red-600 border-red-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                      >
                        {upload.parse_status === "SUCCESS"
                          ? "✓ Thành công"
                          : upload.parse_status === "FAILED"
                            ? "✗ Thất bại"
                            : "⏳ Đang xử lý"}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 font-mono text-red-500 max-w-50 truncate text-xs"
                      title={upload.parse_error || ""}
                    >
                      {upload.parse_error ?? (
                        <span className="text-zinc-300 font-normal">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          onClick={() => {
                            setSelectedUpload(upload);
                            setDetailTab("results");
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-zinc-200 bg-white text-neutral-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteSessionId(upload.id)}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 bg-white text-red-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer"
                          title="Xóa phiên"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          UPLOAD FORM MODAL
      ══════════════════════════════════════════════════════════ */}
      {uploadFormOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-950">
                Nhập bảng điểm mới
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Dán dữ liệu từ cổng đào tạo ASC/Edusoft hoặc tải tệp Excel bảng
                điểm lên.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
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
                  onClick={() => setUploadFormOpen(false)}
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
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════ */}
      {deleteSessionId && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-950">
                  Xác nhận xóa
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Thao tác này không thể hoàn tác
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Toàn bộ học phần đã được bóc tách từ phiên này sẽ bị xóa vĩnh
              viễn khỏi bảng điểm tích lũy của bạn.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteSessionId(null)}
                disabled={deleting}
                className="rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-600 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
              >
                {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      {selectedUpload && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-4xl w-full p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh]">
            <div className="flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-lg font-bold text-neutral-950">
                  Chi tiết phân tích bảng điểm
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  ID: {selectedUpload.id} · Tải lên{" "}
                  {new Date(selectedUpload.uploaded_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedUpload(null)}
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
                    ? `Kết quả môn học (${selectedUpload.parsed_json?.results?.length ?? 0})`
                    : tab === "warnings"
                      ? `Cảnh báo (${selectedUpload.parsed_json?.warnings?.length ?? 0})`
                      : "Văn bản gốc"}
                </button>
              ))}
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {detailTab === "results" && (
                <div className="space-y-3">
                  {selectedUpload.parse_error && (
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-mono">
                      <strong>Lỗi phân tích:</strong> {selectedUpload.parse_error}
                    </div>
                  )}
                  {selectedUpload.parsed_json?.results?.length ? (
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
                          {selectedUpload.parsed_json.results.map(
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
                  {selectedUpload.parsed_json?.warnings?.length ? (
                    selectedUpload.parsed_json.warnings.map(
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
                  {selectedUpload.raw_text}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
