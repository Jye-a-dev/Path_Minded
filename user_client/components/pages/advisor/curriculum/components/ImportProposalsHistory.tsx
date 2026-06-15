import React, { useState, useEffect } from "react";
import { Loader2, Trash2, Search, Calendar, FileText, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import DeleteConfirmModal from "./DeleteConfirmModal";
import NotificationModal, { NotificationItem } from "./NotificationModal";

interface ImportProposal {
  id: string;
  file_name: string;
  import_status: "PENDING" | "SUCCESS" | "FAILED";
  import_error?: string;
  uploaded_at: string;
  processed_at?: string;
  versions?: ImportProposal[];
}

interface ImportProposalsHistoryProps {
  selectedMajor: string;
}

export default function ImportProposalsHistory({ selectedMajor }: ImportProposalsHistoryProps) {
  const [proposals, setProposals] = useState<ImportProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  // Modals state
  const [deleteProposalId, setDeleteProposalId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      // Filter by the advisor's major
      const res = await api.get(`/curriculum_imports?major_name=${encodeURIComponent(selectedMajor)}&limit=100`);
      setProposals(res.data || []);
    } catch (err) {
      console.error("Failed to load import proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedMajor) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        // Filter by the advisor's major
        const res = await api.get(`/curriculum_imports?major_name=${encodeURIComponent(selectedMajor)}&limit=100`);
        if (isMounted) {
          setProposals(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load import proposals:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedMajor]);

  const confirmDelete = async () => {
    if (!deleteProposalId) return;
    const id = deleteProposalId;
    setDeleteProposalId(null);
    try {
      await api.delete(`/curriculum_imports/${id}`);
      setProposals((prev) => prev.filter((p) => p.id !== id));
      setNotification({
        type: "success",
        title: "Rút đề xuất thành công",
        message: "Đã rút đề xuất nhập khung chương trình học thành công."
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Lỗi rút đề xuất",
        message: "Không thể rút đề xuất: " + (err instanceof Error ? err.message : String(err))
      });
    }
  };

  // Group duplicates
  const groupedProposals = Object.values(
    proposals.reduce<Record<string, ImportProposal[]>>((acc, item) => {
      if (!acc[item.file_name]) acc[item.file_name] = [];
      acc[item.file_name].push(item);
      return acc;
    }, {})
  ).map((items) => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    const first = sorted[0];
    const selectedId = selectedVersions[first.file_name] || first.id;
    const activeItem = sorted.find((item) => item.id === selectedId) || first;
    return {
      ...activeItem,
      versions: sorted,
    };
  });

  // Filter
  const filtered = groupedProposals.filter((p) =>
    p.file_name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status: "PENDING" | "SUCCESS" | "FAILED") => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-100 bg-amber-50/50 text-amber-750 font-mono">
            CHỜ PHÊ DUYỆT
          </span>
        );
      case "SUCCESS":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 bg-emerald-50/50 text-emerald-755 font-mono">
            ĐÃ DUYỆT
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-100 bg-rose-50/50 text-rose-755 font-mono">
            TỪ CHỐI / THẤT BẠI
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 border border-zinc-200 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-450 uppercase tracking-wider block font-mono">Quản lý đề xuất nhập của ngành</span>
          <h2 className="text-md font-extrabold text-neutral-900 tracking-tight">
            {selectedMajor || "Chưa chọn ngành"}
          </h2>
        </div>
        <button
          onClick={fetchProposals}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-neutral-55 px-4 py-2.5 text-xs font-bold text-neutral-600 transition cursor-pointer active:scale-98 disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Tải lại danh sách
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative bg-white/95 backdrop-blur-md p-4 border border-zinc-200 rounded-2xl shadow-sm">
        <Search className="absolute left-7 top-5.5 h-4.5 w-4.5 text-neutral-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên file..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all bg-neutral-50/50"
        />
      </div>

      {loading ? (
        <div className="flex h-[30vh] w-full items-center justify-center bg-white/50 border border-zinc-200 rounded-3xl">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-neutral-555">Đang tải lịch sử đề xuất...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-neutral-500 font-bold text-[10px] uppercase tracking-wider select-none">
                    <th className="px-6 py-4">Tên file / Nguồn đề xuất</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Thời gian tải lên</th>
                    <th className="px-6 py-4">Phản hồi từ Admin / Lỗi</th>
                    <th className="px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 font-semibold text-neutral-700">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-neutral-450 italic">
                        Không tìm thấy đề xuất nhập nào.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
                              <FileText size={16} />
                            </div>
                            <div>
                              <span className="text-neutral-900 font-bold block">{p.file_name}</span>
                              {p.versions && p.versions.length > 1 ? (
                                <div className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold text-neutral-500">
                                  <span>Bản tải lên:</span>
                                  <select
                                    value={p.id}
                                    onChange={(e) => setSelectedVersions((prev) => ({ ...prev, [p.file_name]: e.target.value }))}
                                    className="bg-zinc-100 border border-zinc-200 text-neutral-750 px-1 py-0.5 rounded cursor-pointer focus:outline-none text-[9px] font-mono font-bold"
                                  >
                                    {p.versions.map((v: ImportProposal, index: number) => (
                                      <option key={v.id} value={v.id}>
                                        {new Date(v.uploaded_at).toLocaleString()} {index === 0 ? "(Mới nhất)" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : (
                                <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">ID: {p.id}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(p.import_status)}
                        </td>
                        <td className="px-6 py-4 text-neutral-505 font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-neutral-400" />
                            {new Date(p.uploaded_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.import_status === "FAILED" ? (
                            <span className="text-rose-600 text-[11px] font-mono leading-relaxed block max-w-sm truncate" title={p.import_error}>
                              {p.import_error || "Lỗi không xác định"}
                            </span>
                          ) : p.import_status === "SUCCESS" && p.processed_at ? (
                            <span className="text-emerald-700 text-[11px] font-mono block">
                              Đã duyệt lúc {new Date(p.processed_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-[11px] italic block">
                              Đang chờ kiểm tra
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {p.import_status === "PENDING" ? (
                            <button
                              onClick={() => setDeleteProposalId(p.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded-xl transition cursor-pointer active:scale-95"
                              title="Rút lại đề xuất"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <span className="text-neutral-350 italic text-[11px]">Không thể sửa</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-5 py-4 shadow-sm text-xs font-bold text-neutral-500">
              <div>
                Hiển thị <span className="text-neutral-850">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-neutral-850">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> trong tổng số <span className="text-neutral-850">{filtered.length}</span> đề xuất
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Trước
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`rounded-lg h-8 w-8 flex items-center justify-center transition cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/15"
                        : "border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation and Alert Modals */}
      <DeleteConfirmModal
        isOpen={!!deleteProposalId}
        onClose={() => setDeleteProposalId(null)}
        onConfirm={confirmDelete}
        title="Rút lại đề xuất"
        message="Bạn có chắc chắn muốn rút lại đề xuất nhập khung này không? Hành động này không thể hoàn tác."
      />

      <NotificationModal
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
