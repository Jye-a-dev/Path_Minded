import { useState, useEffect } from "react";
import { useTranscriptUploads } from "../../../hooks/useTranscriptUploads";
import type { UploadItem } from "../../../hooks/useTranscriptUploads";
import { DataTable } from "../../../components/data_display/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Trash2, Eye, ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { TranscriptUploadForm } from "./TranscriptUploadForm";
import { api } from "../../../services/api";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";

interface ProgramItem {
  id: string;
  program_name: string;
  major_name?: string;
}

interface ClassItem {
  id: string;
  class_code: string;
}

interface DropdownItem {
  id: string;
  label: string;
}

interface ParsedResultItem {
  courseCode: string;
  courseName?: string;
  credits?: number;
  schoolYear?: string;
  semesterNumber?: number;
  score10?: number;
  score4?: number;
  letterGrade?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
}

export default function TranscriptUploads() {
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
    createUpload,
    updateFilters,
  } = useTranscriptUploads();

  // Setup screen states
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [studentsList, setStudentsList] = useState<DropdownItem[]>([]);

  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Modal / Detail states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UploadItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"results" | "json" | "raw">("results");

  // Delete confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  // Load classes when major changes
  useEffect(() => {
    if (!selectedMajor) return;
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<ClassItem[]>(`/classes?limit=100&program_id=${p.id}`)
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesList(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    void fetchClasses();
  }, [selectedMajor, allPrograms]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const response = await api.get(`/students?limit=250&class_id=${selectedClassId}`);
        setStudentsList(
          (response.data || []).map((s: { id: string; student_code: string; full_name: string }) => ({
            id: s.id,
            label: `${s.student_code} - ${s.full_name}`,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch students list:", err);
      } finally {
        setLoadingStudents(false);
      }
    };
    void fetchStudents();
  }, [selectedClassId]);

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedMajor(val);
    setSelectedClassId("");
    setClassesList([]);
    setSelectedStudentId("");
    setStudentsList([]);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClassId(val);
    setSelectedStudentId("");
    setStudentsList([]);
  };

  const handleConfirmConfig = () => {
    if (selectedStudentId) {
      updateFilters({ student_id: selectedStudentId });
      setIsConfigured(true);
    }
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
    updateFilters({ student_id: undefined });
  };

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleOpenDetail = (row: UploadItem) => {
    setSelectedItem(row);
    setDetailTab("results");
    setDetailOpen(true);
  };

  const handleSubmit = async (payload: { student_id: string; textContent: string }) => {
    await createUpload(payload);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteItem(deletingId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Xóa phiên tải lên thất bại");
      }
    }
  };

  const columns = [
    {
      header: "Sinh viên",
      render: (row: UploadItem) => (
        <div>
          {row.student_code ? (
            <>
              <span className="text-slate-200 font-semibold block">
                {row.full_name}
              </span>
              <span className="text-xs text-slate-400 font-mono block">
                {row.student_code}
              </span>
            </>
          ) : (
            <span className="text-slate-500 italic block">Không có thông tin</span>
          )}
        </div>
      ),
    },
    {
      header: "Phiên tải lên",
      render: (row: UploadItem) => (
        <div>
          <span className="text-slate-200 font-medium block">ID phiên</span>
          <span className="text-[10px] text-slate-500 font-mono block">{row.id}</span>
        </div>
      ),
    },
    {
      header: "Loại nguồn",
      accessorKey: "source_type",
      render: (row: UploadItem) => (
        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 uppercase tracking-wide">
          {row.source_type}
        </span>
      ),
    },
    {
      header: "Trạng thái",
      accessorKey: "parse_status",
      render: (row: UploadItem) => {
        const badges = {
          PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          SUCCESS: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        };
        const statusMap = {
          PENDING: "CHỜ XỬ LÝ",
          SUCCESS: "THÀNH CÔNG",
          FAILED: "THẤT BẠI",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${badges[row.parse_status]}`}
          >
            {statusMap[row.parse_status]}
          </span>
        );
      },
    },
    {
      header: "Thời gian Tải lên / Phân tích",
      render: (row: UploadItem) => (
        <div className="text-xs text-slate-400 font-mono">
          <div>Tải lên: {new Date(row.uploaded_at).toLocaleString()}</div>
          {row.parsed_at && (
            <div className="text-emerald-500">Phân tích: {new Date(row.parsed_at).toLocaleString()}</div>
          )}
        </div>
      ),
    },
    {
      header: "Nhật ký lỗi",
      accessorKey: "parse_error",
      render: (row: UploadItem) => (
        <span className="text-xs text-rose-400 font-mono max-w-50 truncate block font-normal" title={row.parse_error}>
          {row.parse_error || "Không có"}
        </span>
      ),
    },
    {
      header: "Thao tác",
      render: (row: UploadItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDetail(row)}
            title="Xem chi tiết phân tích"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            title="Xóa phiên"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <GraduationCap className="text-indigo-400! h-8 w-8" />
            Nhập &amp; Phân tích Bảng điểm
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành, lớp học và sinh viên mục tiêu.
          </p>
        </div>

        {loadingPrograms ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            Đang tải dữ liệu cấu hình hệ thống...
          </div>
        ) : (
          <div className="relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-8 shadow-xl shadow-slate-950/50 backdrop-blur-md space-y-6">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl" />

            <div className="space-y-4">
              {/* Major Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyên ngành</label>
                <select
                  value={selectedMajor}
                  onChange={handleMajorChange}
                  className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                >
                  <option className="bg-slate-900 text-slate-500" value="">-- Chọn chuyên ngành --</option>
                  {uniqueMajors.map((major) => (
                    <option className="bg-slate-900 text-slate-100" key={major} value={major}>{major}</option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học</label>
                {loadingClasses ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-955/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách lớp...
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    disabled={!selectedMajor || classesList.length === 0}
                    onChange={handleClassChange}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-550" value="">
                      {!selectedMajor
                        ? "-- Vui lòng chọn chuyên ngành trước --"
                        : classesList.length === 0
                        ? "-- Không tìm thấy lớp học nào --"
                        : "-- Chọn lớp học --"}
                    </option>
                    {classesList.map((c) => (
                      <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                        {c.class_code}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sinh viên</label>
                {loadingStudents ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-955/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách sinh viên...
                  </div>
                ) : (
                  <select
                    value={selectedStudentId}
                    disabled={!selectedClassId || studentsList.length === 0}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-955/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-550" value="">
                      {!selectedClassId
                        ? "-- Vui lòng chọn lớp học trước --"
                        : studentsList.length === 0
                        ? "-- Không tìm thấy sinh viên nào --"
                        : "-- Chọn sinh viên --"}
                    </option>
                    {studentsList.map((s) => (
                      <option className="bg-slate-900 text-slate-100" key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmConfig}
              disabled={!selectedStudentId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xác nhận cấu hình
            </button>
          </div>
        )}
      </div>
    );
  }

  const selectedClassName = classesList.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;
  const selectedStudentLabel = studentsList.find((s) => s.id === selectedStudentId)?.label ?? selectedStudentId;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetConfig}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">Tải bảng điểm lên</h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                {selectedClassName}
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20 uppercase tracking-wide">
                {selectedStudentLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Đang xem phiên tải bảng điểm của sinh viên{" "}
              <span className="text-slate-200 font-semibold">{selectedStudentLabel}</span> — chuyên ngành{" "}
              <span className="text-slate-200 font-semibold">{selectedMajor}</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<UploadItem>
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
        searchPlaceholder="Tìm kiếm phiên tải lên bảng điểm..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tải bảng điểm
          </button>
        }
      />

      {/* Modal Upload Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title="Nhập tệp bảng điểm sinh viên"
        size="lg"
      >
        <TranscriptUploadForm
          key={selectedStudentId}
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeletingId(null);
        }}
        title="Xóa phiên tải lên"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn phiên tải lên bảng điểm này không? Hành động này không thể hoàn tác và sẽ xóa tất cả các kết quả học tập của phiên này."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        isDanger={true}
        onConfirm={handleConfirmDelete}
      />

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title={`Chi tiết phiên tải lên - ${selectedItem.full_name || selectedItem.student_code || selectedItem.id}`}
          size="xl"
        >
          <div className="space-y-4">
            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Sinh viên:</span>
                <span className="text-slate-200 font-bold block">{selectedItem.full_name || "N/A"}</span>
                <span className="text-[10px] text-slate-400 font-mono block">{selectedItem.student_code || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Trạng thái:</span>
                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border uppercase tracking-wide mt-1 ${
                  selectedItem.parse_status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedItem.parse_status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {selectedItem.parse_status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Ngày tải lên:</span>
                <span className="text-slate-200 block font-mono mt-1">{new Date(selectedItem.uploaded_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">ID phiên:</span>
                <span className="text-slate-200 block font-mono truncate mt-1" title={selectedItem.id}>{selectedItem.id}</span>
              </div>
            </div>

            {/* Tab buttons */}
            <div className="flex border-b border-slate-800 gap-2">
              <button
                onClick={() => setDetailTab("results")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  detailTab === "results"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Kết quả môn học
              </button>
              <button
                onClick={() => setDetailTab("json")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  detailTab === "json"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Dữ liệu JSON phân tích
              </button>
              <button
                onClick={() => setDetailTab("raw")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  detailTab === "raw"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Văn bản gốc
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-60 overflow-auto" style={{ maxHeight: "450px" }}>
              {detailTab === "results" && (
                <div className="space-y-4">
                  {selectedItem.parse_error && (
                    <div className="rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20 font-mono">
                      <strong>Lỗi phân tích:</strong> {selectedItem.parse_error}
                    </div>
                  )}

                  {selectedItem.parsed_json?.results?.length > 0 ? (
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-450 font-bold border-b border-slate-800">
                            <th className="p-3">Học kỳ</th>
                            <th className="p-3">Mã môn</th>
                            <th className="p-3">Tên môn học</th>
                            <th className="p-3 text-center">Tín chỉ</th>
                            <th className="p-3 text-center">Hệ 10</th>
                            <th className="p-3 text-center">Hệ 4</th>
                            <th className="p-3 text-center">Điểm chữ</th>
                            <th className="p-3">Kết quả</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {selectedItem.parsed_json.results.map((res: ParsedResultItem, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                              <td className="p-3 font-medium text-slate-450">
                                {res.schoolYear === 'Bảo lưu' ? (
                                  <span className="inline-flex items-center rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">Bảo lưu</span>
                                ) : (
                                  `${res.schoolYear} - HK${res.semesterNumber}`
                                )}
                              </td>
                              <td className="p-3 font-mono font-bold text-indigo-400">{res.courseCode}</td>
                              <td className="p-3">{res.courseName || "N/A"}</td>
                              <td className="p-3 text-center font-semibold text-slate-400">{res.credits ?? 0}</td>
                              <td className="p-3 text-center font-mono">{res.score10 !== null ? res.score10 : "-"}</td>
                              <td className="p-3 text-center font-mono">{res.score4 !== null ? res.score4 : "-"}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-200">{res.letterGrade || "-"}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  res.status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  res.status === 'FAILED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {res.status === 'PASSED' ? 'ĐẠT' : res.status === 'FAILED' ? 'KHÔNG ĐẠT' : 'ĐANG HỌC'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      Không có kết quả môn học nào được tìm thấy hoặc phân tích lỗi.
                    </div>
                  )}
                </div>
              )}

              {detailTab === "json" && (
                <pre className="bg-slate-950 p-4 rounded-xl text-xs overflow-auto font-mono text-emerald-400 max-h-96 border border-slate-800">
                  {JSON.stringify(selectedItem.parsed_json || { message: "Không có dữ liệu JSON" }, null, 2)}
                </pre>
              )}

              {detailTab === "raw" && (
                <pre className="bg-slate-950 p-4 rounded-xl text-xs overflow-auto font-mono text-slate-300 max-h-96 whitespace-pre-wrap border border-slate-800">
                  {selectedItem.raw_text}
                </pre>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
