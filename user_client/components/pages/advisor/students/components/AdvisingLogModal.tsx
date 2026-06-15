import React, { useState, useEffect, useCallback } from "react";
import { X, MessageSquare, Plus, Loader2, Calendar, User, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { StudentItem } from "./StudentModal";
import { api } from "@/services/api";
import ConfirmationModal from "./ConfirmationModal";

interface AdvisingLog {
  id: string;
  student_id: string;
  advisor_id: string | null;
  alert_id: string | null;
  log_date: string;
  content: string;
  advisor_name: string | null;
  alert_type: string | null;
  alert_description: string | null;
}

interface ActiveAlert {
  id: string;
  student_id: string;
  alert_type: "PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING";
  alert_status: "ACTIVE" | "RESOLVED";
  gpa?: number | null;
  total_credits?: number | null;
  description: string;
  created_at: string;
  updated_at: string;
}

interface AdvisingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
  advisorId: string | null;
  onAlertResolved?: () => void; // Trigger student reload in list
}

export default function AdvisingLogModal({
  isOpen,
  onClose,
  student,
  advisorId,
  onAlertResolved
}: AdvisingLogModalProps) {
  const [logs, setLogs] = useState<AdvisingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Alert status state
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [resolving, setResolving] = useState(false);

  // Custom confirmation modal states
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);

  const fetchLogsAndAlerts = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch advising logs
      const logsRes = await api.get(`/alerts/advising-logs?studentId=${student.id}`);
      setLogs(logsRes.data || []);

      // 2. Fetch active alert
      const alertRes = await api.get(`/alerts/active?studentId=${student.id}`);
      setActiveAlert(alertRes.data || null);
    } catch (err) {
      console.error("Failed to load advising details:", err);
      setError("Không thể tải lịch sử tư vấn hoặc cảnh báo học thuật.");
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (isOpen && student) {
      const timer = setTimeout(() => {
        void fetchLogsAndAlerts();
        setContent("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, student, fetchLogsAndAlerts]);

  if (!isOpen || !student) return null;

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await api.post("/alerts/advising-logs", {
        student_id: student.id,
        advisor_id: advisorId,
        alert_id: activeAlert?.id || null,
        content: content.trim()
      });
      setContent("");
      // Refetch
      await fetchLogsAndAlerts();
    } catch (err) {
      console.error("Failed to save advising log:", err);
      setError("Không thể tạo ghi chú tư vấn mới.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = (logId: string) => {
    setDeleteLogId(logId);
  };

  const performDeleteLog = async () => {
    if (!deleteLogId) return;
    setError(null);
    try {
      await api.delete(`/alerts/advising-logs/${deleteLogId}`);
      await fetchLogsAndAlerts();
    } catch (err) {
      console.error("Failed to delete log:", err);
      setError("Không thể xóa nhật ký tư vấn.");
    } finally {
      setDeleteLogId(null);
    }
  };

  const handleResolveAlert = () => {
    if (!activeAlert) return;
    setShowResolveConfirm(true);
  };

  const performResolveAlert = async () => {
    if (!activeAlert) return;
    setResolving(true);
    setError(null);
    try {
      await api.patch(`/alerts/${activeAlert.id}/status`, {
        status: "RESOLVED"
      });
      // Refetch
      await fetchLogsAndAlerts();
      if (onAlertResolved) onAlertResolved();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
      setError("Không thể cập nhật trạng thái cảnh báo.");
    } finally {
      setResolving(false);
      setShowResolveConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="bg-white border border-zinc-200 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 transition cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="p-5 border-b border-zinc-150 shrink-0">
          <h3 className="text-base font-extrabold text-neutral-950 flex items-center gap-2">
            <MessageSquare className="text-violet-655" size={18} />
            <span>Nhật ký tư vấn & Cảnh báo học tập</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-1 font-semibold">
            Sinh viên: {student.full_name} ({student.student_code})
          </p>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Academic Warning Status Area */}
          <div className="border border-zinc-200 rounded-2xl p-4.5 bg-zinc-50/50 space-y-3">
            <h4 className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider">
              Trạng thái cảnh báo hiện tại
            </h4>
            
            {loading ? (
              <div className="py-4 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : activeAlert ? (
              <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-amber-850">
                    <AlertTriangle size={14} className="text-amber-600 animate-pulse" />
                    <span>
                      {activeAlert.alert_type === "PROBATION_RISK"
                        ? "RỦI RO BUỘC THÔI HỌC / ĐÌNH CHỈ"
                        : activeAlert.alert_type === "GPA_WARNING"
                        ? "GPA DƯỚI MỨC AN TOÀN"
                        : "CẢNH BÁO TRỄ TIẾN ĐỘ / MÔN TIÊN QUYẾT"}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                    {activeAlert.description}
                  </p>
                  {activeAlert.gpa && (
                    <p className="text-[10px] text-amber-700 font-bold">
                      GPA cảnh báo: {Number(activeAlert.gpa).toFixed(2)}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleResolveAlert}
                  disabled={resolving}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  {resolving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Giải quyết cảnh báo
                </button>
              </div>
            ) : (
              <div className="border border-emerald-100 bg-emerald-50/20 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Sinh viên hiện tại không bị cảnh báo học tập hoặc đã xử lý xong.</span>
              </div>
            )}
          </div>

          {/* 2. Write new log form */}
          <form onSubmit={handleSaveLog} className="space-y-2">
            <label className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider block">
              Thêm ghi chú tư vấn mới
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập nội dung tư vấn học tập, điều chỉnh lộ trình hoặc các cam kết từ sinh viên..."
                required
                className="flex-1 w-full border border-zinc-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-violet-500 bg-neutral-50/30 min-h-20"
              />
              <button
                type="submit"
                disabled={saving || !content.trim()}
                className="rounded-xl px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-violet-600/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                <span>Lưu ghi chú</span>
              </button>
            </div>
          </form>

          {/* 3. Advising timeline history */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold text-neutral-700 uppercase tracking-wider">
              Lịch sử nhật ký tư vấn ({logs.length})
            </h4>

            {loading && logs.length === 0 ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">
                Chưa có ghi chú tư vấn nào cho sinh viên này.
              </p>
            ) : (
              <div className="space-y-3 pb-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-zinc-150 rounded-2xl p-4 bg-white hover:shadow-xs transition-shadow relative group"
                  >
                    {/* Delete action */}
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Xóa ghi chú"
                    >
                      <Trash2 size={12} />
                    </button>

                    <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-bold text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        <span>{new Date(log.log_date).toLocaleString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={11} />
                        <span>Cố vấn: {log.advisor_name || "Hệ thống"}</span>
                      </div>
                      {log.alert_type && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.2 rounded text-[9px]">
                          Liên kết cảnh báo
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-700 mt-2 whitespace-pre-wrap leading-relaxed">
                      {log.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-150 bg-zinc-50 shrink-0 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-55 text-neutral-600 text-xs font-bold transition cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteLogId !== null}
        onClose={() => setDeleteLogId(null)}
        onConfirm={performDeleteLog}
        title="Xóa nhật ký tư vấn"
        message="Bạn có chắc chắn muốn xóa nhật ký tư vấn này? Hành động này không thể hoàn tác."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        type="danger"
      />

      {/* Resolve Alert Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResolveConfirm}
        onClose={() => setShowResolveConfirm(false)}
        onConfirm={performResolveAlert}
        title="Giải quyết cảnh báo"
        message="Bạn muốn đánh dấu cảnh báo này đã được giải quyết theo lộ trình mới?"
        confirmText="Giải quyết"
        cancelText="Hủy bỏ"
        type="warning"
      />
    </div>
  );
}
