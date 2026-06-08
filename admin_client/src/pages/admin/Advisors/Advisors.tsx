import { useState, useEffect } from "react";
import { useAdvisors } from "../../../hooks/useAdvisors";
import type { AdvisorItem } from "../../../hooks/useAdvisors";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { AdvisorForm } from "./AdvisorForm";
import { Plus, Edit2, Trash2, Briefcase, Link2, X, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "../../../services/api";

export default function Advisors() {
  const [initialDepartment] = useState(() => {
    return sessionStorage.getItem("selected_advisors_department") || "";
  });

  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    filters: activeFilters,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    createItem,
    updateItem,
    deleteItem,
  } = useAdvisors(
    {
      department: initialDepartment || undefined,
    },
    {
      skip: (f) => !f.department,
    }
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdvisorItem | null>(null);

  const [allAdvisors, setAllAdvisors] = useState<AdvisorItem[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const res = await api.get("/advisors?limit=500");
        setAllAdvisors(res.data || []);
      } catch (err) {
        console.error("Failed to load advisors metadata:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };
    void fetchMetadata();
  }, []);

  const uniqueDepartments = Array.from(
    new Set(
      allAdvisors
        .map((a) => a.department?.trim() || "")
        .filter((d) => !!d)
    )
  ).sort();

  const handleEnter = () => {
    if (selectedDept) {
      sessionStorage.setItem("selected_advisors_department", selectedDept);
      updateFilters({
        department: selectedDept,
      });
    }
  };

  const handleClearSelection = () => {
    sessionStorage.removeItem("selected_advisors_department");
    updateFilters({
      department: undefined,
    });
    setSelectedDept("");
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: AdvisorItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    full_name: string;
    department: string | null;
    user_id: string | null;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn Cố vấn học tập này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa cố vấn học tập thất bại");
      }
    }
  };

  const handleClearFilters = () => {
    setSearch("");
  };

  const columns = [
    {
      header: "Họ và tên",
      accessorKey: "full_name",
      render: (row: AdvisorItem) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-400" />
          <span className="text-slate-200 font-bold">{row.full_name}</span>
        </div>
      ),
    },
    {
      header: "Khoa / Ban",
      accessorKey: "department",
      render: (row: AdvisorItem) => (
        <span className="text-slate-400 font-normal">{row.department || "N/A"}</span>
      ),
    },
    {
      header: "Tài khoản liên kết",
      accessorKey: "user_id",
      render: (row: AdvisorItem) => (
        <span className="text-xs text-slate-400">
          {row.user_id ? (
            <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-955/40 px-2 py-0.5 rounded border border-indigo-900/40" title={`ID: ${row.user_id}`}>
              <Link2 size={12} />
              {row.email || row.user_id}
            </span>
          ) : (
            <span className="text-slate-600">Chưa liên kết</span>
          )}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: AdvisorItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {!activeFilters?.department ? (
        /* Selection Screen */
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-[65vh]">
          <div className="max-w-md w-full space-y-8 p-8 rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
            {/* Glow effect */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center relative z-10">
              <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-tr from-indigo-500 to-indigo-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-6 text-xl font-extrabold text-white tracking-tight">Cố vấn học tập</h2>
              <p className="mt-2 text-xs text-slate-400">
                Vui lòng chọn Khoa / Ban để bắt đầu quản lý hồ sơ cố vấn học tập.
              </p>
            </div>

            {loadingMetadata ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                <span>Đang tải thông tin...</span>
              </div>
            ) : (
              <div className="mt-8 space-y-6 relative z-10">
                {/* Department Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Khoa / Ban quản lý (Department)
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                  >
                    <option value="">-- Chọn khoa / ban --</option>
                    {uniqueDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  disabled={!selectedDept}
                  onClick={handleEnter}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm text-white transition-all duration-300 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer font-bold"
                >
                  Truy cập Cố vấn
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Data Table Screen */
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Danh sách Cố vấn</h1>
            <p className="text-xs text-slate-400">
              Quản lý cố vấn học tập, nhóm khoa ban và liên kết họ với tài khoản đăng nhập hệ thống.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <Briefcase size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-200">
                    Khoa / Ban: {activeFilters?.department as string}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đang hiển thị danh sách cố vấn thuộc khoa/ban đã chọn.
                </p>
              </div>
            </div>
            <div>
              <button
                onClick={handleClearSelection}
                className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-855 hover:border-slate-700 transition-all cursor-pointer"
              >
                Thay đổi khoa / ban
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
              {error}
            </div>
          )}

          {/* Data Table */}
          <DataTable<AdvisorItem>
            columns={columns}
            data={data}
            loading={loading}
            total={total}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm kiếm tên cố vấn..."
            filters={
              search && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-355 font-semibold px-2 py-1.5 rounded bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 transition-all cursor-pointer"
                >
                  <X size={12} />
                  Xóa lọc
                </button>
              )
            }
            rightActions={
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Tạo Cố vấn
              </button>
            }
          />
        </div>
      )}

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Chỉnh sửa thông tin Cố vấn" : "Tạo hồ sơ Cố vấn"}
      >
        <AdvisorForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          defaultDepartment={activeFilters?.department as string}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
