import { useState, useEffect } from "react";
import { useExports } from "../../../hooks/useExports";
import type { ExportItem } from "../../../hooks/useExports";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Trash2, TableProperties, Loader2, DownloadCloud } from "lucide-react";
import { ExportForm } from "./ExportForm";
import { MatrixTable } from "./MatrixTable";
import { api } from "../../../services/api";
import { MatrixSelector } from "./components/MatrixSelector";
import { MatrixHeader } from "./components/MatrixHeader";

export default function Exports() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    setPage,
    setLimit,
    setSearch,
    deleteItem,
    createExport,
  } = useExports();

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matrix" | "history">("matrix");

  // Selection states for matrix preview
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedAdvisorId, setSelectedAdvisorId] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [viewMatrix, setViewMatrix] = useState(false);

  const [classesList, setClassesList] = useState<
    Array<{ id: string; label: string; advisor_id: string; program_id: string }>
  >([]);
  const [advisorsList, setAdvisorsList] = useState<Array<{ id: string; label: string }>>([]);
  const [programsList, setProgramsList] = useState<
    Array<{ id: string; program_name: string; program_code: string; major_name?: string | null }>
  >([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Matrix preview state (for history tab modal preview)
  const [previewClassId, setPreviewClassId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch classes, advisors, and programs for selectors
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      try {
        const [classesRes, advisorsRes, programsRes] = await Promise.all([
          api.get("/classes?limit=1000"),
          api.get("/advisors?limit=1000"),
          api.get("/programs?limit=250"),
        ]);
        setClassesList(
          (classesRes.data || []).map((c: { id: string; class_code: string; advisor_id?: string; program_id?: string }) => ({
            id: c.id,
            label: c.class_code,
            advisor_id: c.advisor_id || "",
            program_id: c.program_id || "",
          }))
        );
        setAdvisorsList(
          (advisorsRes.data || []).map((a: { id: string; full_name: string }) => ({
            id: a.id,
            label: a.full_name,
          }))
        );
        setProgramsList(programsRes.data || []);
      } catch (e) {
        console.error("Failed to load options lists in Exports page:", e);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdowns();
  }, []);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    if (classId) {
      const classObj = classesList.find((c) => c.id === classId);
      if (classObj && classObj.advisor_id) {
        setSelectedAdvisorId(classObj.advisor_id);
      } else {
        setSelectedAdvisorId("");
      }
    } else {
      setSelectedAdvisorId("");
    }
  };

  const handleOpenCreate = () => setModalOpen(true);
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const uniqueMajors = Array.from(
    new Set(programsList.map((p) => p.major_name?.trim() || "").filter((m) => !!m))
  ).sort();

  const filteredPrograms = programsList.filter((p) => {
    if (!selectedMajor) return false;
    return p.major_name?.trim() === selectedMajor;
  });

  const filteredClasses = classesList.filter((c) => {
    if (!selectedProgramId) return false;
    return c.program_id === selectedProgramId;
  });

  const handleSubmit = async (payload: {
    class_id: string;
    program_id: string | null;
    advisor_id: string | null;
  }) => {
    await createExport(payload);
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi xuất dữ liệu này?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa bản ghi xuất thất bại");
      }
    }
  };

  // Generic Excel download helper
  const handleDownloadExcel = async (classId: string, advisorId: string | null, classCode: string) => {
    setDownloadingId(classId);
    try {
      const response = await api.post(
        "/exports/matrix",
        { classId, advisorId: advisorId || null },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = `Matrix_${classCode}_${Date.now()}.xlsx`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Tải Excel thất bại");
    } finally {
      setDownloadingId(null);
    }
  };

  // Download Excel for a row in history tab
  const handleDownloadMatrix = async (row: ExportItem) => {
    if (!row.class_id) return;
    const classObj = classesList.find((c) => c.id === row.class_id);
    const classCode = classObj ? classObj.label : "Export";
    await handleDownloadExcel(row.class_id, row.advisor_id || null, classCode);
  };

  const columns = [
    {
      header: "Chi tiết tệp",
      render: (row: ExportItem) => (
        <div>
          <span className="text-slate-200 font-bold block">{row.file_name}</span>
          <span className="text-[10px] text-slate-500 font-mono block">ID: {row.id}</span>
        </div>
      ),
    },
    {
      header: "Loại xuất",
      accessorKey: "export_type",
      render: (row: ExportItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase tracking-wide">
          {row.export_type}
        </span>
      ),
    },
    {
      header: "Thời gian tạo",
      accessorKey: "created_at",
      render: (row: ExportItem) => (
        <span className="text-xs text-slate-450 font-mono">
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: ExportItem) => (
        <div className="flex items-center gap-2">
          {row.class_id && (
            <button
              onClick={() => setPreviewClassId(row.class_id!)}
              className="flex items-center gap-1.5 rounded bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition cursor-pointer"
              title="Xem ma trận kiểm định"
            >
              <TableProperties size={12} />
              Xem ma trận
            </button>
          )}
          {row.class_id && (
            <button
              onClick={() => handleDownloadMatrix(row)}
              disabled={downloadingId === row.class_id}
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition cursor-pointer"
              title="Tải xuống Excel"
            >
              {downloadingId === row.class_id ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <DownloadCloud size={12} />
              )}
              Tải Excel
            </button>
          )}
          {!row.class_id && row.file_path && (
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/${row.file_path}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition"
            >
              <DownloadCloud size={12} />
              Tải tệp
            </a>
          )}
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const selectedClassObj = classesList.find((c) => c.id === selectedClassId);
  const activeClassCode = selectedClassObj ? selectedClassObj.label : "Class";
  const activeAdvisorObj = advisorsList.find((a) => a.id === selectedAdvisorId);

  return (
    <>
      <div className="space-y-6">
        {/* Title Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Xuất dữ liệu</h1>
            <p className="mt-1 text-xs text-slate-400">
              Tra cứu và xuất bảng tính ma trận kiểm định học tập của sinh viên theo lớp học và cố vấn học tập.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Xem ma trận trực tuyến
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "history"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Lịch sử xuất tệp
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        {activeTab === "matrix" ? (
          !viewMatrix ? (
            /* Selection Screen component */
            <MatrixSelector
              loadingDropdowns={loadingDropdowns}
              selectedMajor={selectedMajor}
              setSelectedMajor={setSelectedMajor}
              selectedProgramId={selectedProgramId}
              setSelectedProgramId={setSelectedProgramId}
              selectedClassId={selectedClassId}
              handleClassChange={handleClassChange}
              uniqueMajors={uniqueMajors}
              filteredPrograms={filteredPrograms}
              filteredClasses={filteredClasses}
              activeAdvisorObj={activeAdvisorObj}
              setViewMatrix={setViewMatrix}
            />
          ) : (
            /* Matrix View Screen header component */
            <div className="space-y-4">
              <MatrixHeader
                activeClassCode={activeClassCode}
                selectedAdvisorId={selectedAdvisorId}
                activeAdvisorObj={activeAdvisorObj}
                setViewMatrix={setViewMatrix}
                handleDownloadExcel={() =>
                  handleDownloadExcel(selectedClassId, selectedAdvisorId, activeClassCode)
                }
                downloading={downloadingId === selectedClassId}
              />

              {/* Inline Matrix Preview */}
              <MatrixTable
                classId={selectedClassId}
                isInline={true}
                onDownload={() =>
                  handleDownloadExcel(selectedClassId, selectedAdvisorId, activeClassCode)
                }
                downloading={downloadingId === selectedClassId}
              />
            </div>
          )
        ) : (
          /* Data Table */
          <DataTable<ExportItem>
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
            searchPlaceholder="Tìm kiếm tên tệp xuất..."
            rightActions={
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-650 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus size={16} />
                Xuất ma trận
              </button>
            }
          />
        )}

        {/* Create Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Chạy quy trình xuất bảng tính ma trận"
          size="lg"
        >
          <ExportForm onSubmit={handleSubmit} onCancel={handleCloseModal} />
        </Modal>
      </div>

      {/* Full-screen Matrix Preview (for history preview button) */}
      {previewClassId && (
        <MatrixTable
          classId={previewClassId}
          onClose={() => setPreviewClassId(null)}
          onDownload={() => {
            const row = data.find((d) => d.class_id === previewClassId);
            if (row) handleDownloadMatrix(row);
          }}
          downloading={downloadingId === previewClassId}
        />
      )}
    </>
  );
}
