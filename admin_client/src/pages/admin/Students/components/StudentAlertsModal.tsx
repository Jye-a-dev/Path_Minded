import { useState, useEffect, useCallback } from "react";
import { api } from "../../../../services/api";
import { Modal } from "../../../../components/ui/Modal";
import { Trash2, Edit2, Plus, X, Loader2, ShieldCheck } from "lucide-react";

interface StudentItem {
  id: string;
  student_code: string;
  full_name: string;
}

interface AcademicAlert {
  id: string;
  student_id: string;
  alert_type: "PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING";
  alert_status: "ACTIVE" | "RESOLVED";
  gpa: string | number | null;
  total_credits: number | null;
  description: string;
  created_at: string;
}

interface StudentAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentItem | null;
}

export function StudentAlertsModal({ isOpen, onClose, student }: StudentAlertsModalProps) {
  const [alerts, setAlerts] = useState<AcademicAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AcademicAlert | null>(null);
  const [alertType, setAlertType] = useState<"PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING">("GPA_WARNING");
  const [alertStatus, setAlertStatus] = useState<"ACTIVE" | "RESOLVED">("ACTIVE");
  const [gpa, setGpa] = useState<string>("");
  const [totalCredits, setTotalCredits] = useState<string>("");
  const [description, setDescription] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/alerts/student/${student.id}`);
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError("Không thể tải danh sách cảnh báo học tập.");
    } finally {
      setLoading(false);
    }
  }, [student]);

  const handleOpenCreate = () => {
    setEditingAlert(null);
    setAlertType("GPA_WARNING");
    setAlertStatus("ACTIVE");
    setGpa("");
    setTotalCredits("");
    setDescription("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (alert: AcademicAlert) => {
    setEditingAlert(alert);
    setAlertType(alert.alert_type);
    setAlertStatus(alert.alert_status);
    setGpa(alert.gpa !== null ? String(alert.gpa) : "");
    setTotalCredits(alert.total_credits !== null ? String(alert.total_credits) : "");
    setDescription(alert.description || "");
    setIsFormOpen(true);
  };

  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingAlert(null);
  }, []);

  useEffect(() => {
    if (isOpen && student) {
      const timer = setTimeout(() => {
        void fetchAlerts();
        handleCancelForm();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, student, fetchAlerts, handleCancelForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setFormSubmitting(true);
    setError(null);

    const payload = {
      studentId: student.id,
      alertType,
      alertStatus,
      gpa: gpa !== "" ? Number(gpa) : null,
      totalCredits: totalCredits !== "" ? Number(totalCredits) : null,
      description,
    };

    try {
      if (editingAlert) {
        await api.put(`/alerts/${editingAlert.id}`, payload);
      } else {
        await api.post("/alerts", payload);
      }
      setIsFormOpen(false);
      setEditingAlert(null);
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to save alert:", err);
      setError("Không thể lưu thông tin cảnh báo học tập.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cảnh báo này không?")) return;
    setError(null);
    try {
      await api.delete(`/alerts/${alertId}`);
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to delete alert:", err);
      setError("Không thể xóa cảnh báo học tập.");
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case "PROBATION_RISK":
        return "Rủi ro buộc thôi học";
      case "GPA_WARNING":
        return "Cảnh báo GPA thấp";
      case "CREDIT_WARNING":
        return "Cảnh báo thiếu tín chỉ";
      default:
        return type;
    }
  };

  const getAlertBadgeColor = (type: string, status: string) => {
    if (status === "RESOLVED") {
      return "bg-slate-800 text-slate-400 border-slate-700";
    }
    switch (type) {
      case "PROBATION_RISK":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "GPA_WARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CREDIT_WARNING":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? `Cảnh báo học tập: ${student.full_name} (${student.student_code})` : "Quản lý Cảnh báo học tập"}
      size="xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        {/* Create/Edit Form Container */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="border border-slate-800 bg-slate-900/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-1">
              <span className="text-xs font-bold text-slate-300">
                {editingAlert ? "Chỉnh sửa cảnh báo" : "Tạo cảnh báo mới"}
              </span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-slate-500 hover:text-slate-300"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Loại cảnh báo</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as "PROBATION_RISK" | "GPA_WARNING" | "CREDIT_WARNING")}
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 cursor-pointer focus:border-indigo-500 focus:outline-none"
                >
                  <option value="GPA_WARNING">Cảnh báo GPA thấp</option>
                  <option value="CREDIT_WARNING">Cảnh báo thiếu tín chỉ</option>
                  <option value="PROBATION_RISK">Rủi ro buộc thôi học</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Trạng thái</label>
                <select
                  value={alertStatus}
                  onChange={(e) => setAlertStatus(e.target.value as "ACTIVE" | "RESOLVED")}
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 cursor-pointer focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">GPA tích lũy (nếu có)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="Ví dụ: 1.85"
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-semibold">Số tín chỉ bị ảnh hưởng/thiếu</label>
                <input
                  type="number"
                  min="0"
                  value={totalCredits}
                  onChange={(e) => setTotalCredits(e.target.value)}
                  placeholder="Ví dụ: 12"
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400 block font-semibold">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập nội dung cảnh báo học tập hoặc lý do cụ thể..."
                  className="w-full rounded border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={handleCancelForm}
                className="rounded px-3 py-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 text-[11px] transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="rounded px-4.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {formSubmitting && <Loader2 size={10} className="animate-spin" />}
                Xác nhận lưu
              </button>
            </div>
          </form>
        )}

        {/* Alerts list controls */}
        {!isFormOpen && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">
              Tổng số: <strong className="text-slate-200">{alerts.length}</strong> cảnh báo
            </span>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1 rounded bg-indigo-650 hover:bg-indigo-600 px-3 py-1.5 text-xs font-bold text-indigo-100 border border-indigo-800 shadow-sm transition cursor-pointer"
            >
              <Plus size={12} />
              Thêm cảnh báo
            </button>
          </div>
        )}

        {/* Alerts List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex py-8 items-center justify-center text-slate-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold">Đang tải cảnh báo...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
              <p className="text-xs text-slate-500 font-bold">Không có cảnh báo học tập nào cho sinh viên này.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase ${getAlertBadgeColor(alert.alert_type, alert.alert_status)}`}
                    >
                      {getAlertLabel(alert.alert_type)}
                    </span>
                    {alert.alert_status === "RESOLVED" && (
                      <span className="inline-flex items-center gap-0.5 rounded-md border border-slate-800 bg-slate-900 px-2 py-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        <ShieldCheck size={9} />
                        Đã xử lý
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(alert)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      title="Sửa cảnh báo"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition cursor-pointer"
                      title="Xóa cảnh báo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {alert.description && (
                    <p className="text-slate-300 font-medium whitespace-pre-wrap">{alert.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-semibold pt-1">
                    {alert.gpa !== null && (
                      <span>GPA: <strong className="text-slate-400">{alert.gpa}</strong></span>
                    )}
                    {alert.total_credits !== null && (
                      <span>Số tín chỉ: <strong className="text-slate-400">{alert.total_credits}</strong></span>
                    )}
                    <span>Ngày tạo: <strong className="text-slate-400">{new Date(alert.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
