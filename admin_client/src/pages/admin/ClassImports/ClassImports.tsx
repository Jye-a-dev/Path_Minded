import { useState, useEffect } from "react";
import { useClassImportRows } from "../../../hooks/useClassImportRows";
import { useStudents } from "../../../hooks/useStudents";
import { Loader2, FolderInput, ChevronLeft, GraduationCap, ListOrdered } from "lucide-react";
import { api } from "../../../services/api";
import { ImportsTab } from "./partials/ImportsTab";
import { RowsTab } from "./partials/RowsTab";
import { StudentsTab } from "./partials/StudentsTab";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = "imports" | "rows" | "students";

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name?: string | null;
}

interface ClassItem {
  id: string;
  class_code: string;
  class_name?: string;
  program_id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function ClassImports() {
  // ── Shared setup state ──────────────────────────────────────────────────────
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [classesForMajor, setClassesForMajor] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // ── Active tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("imports");

  // ── Hooks for filter sync ────────────────────────────────────────────────────
  const { updateFilters: updateRowsFilters } = useClassImportRows();
  const { updateFilters: updateStudentsFilters } = useStudents();

  // ── Load programs ────────────────────────────────────────────────────────────
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

  // ── Load classes when major changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedMajor || allPrograms.length === 0) return;
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
        setClassesForMajor(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    void fetchClasses();
  }, [selectedMajor, allPrograms]);

  // ── Apply filters after configure ───────────────────────────────────────────
  useEffect(() => {
    if (isConfigured && selectedClassId) {
      updateRowsFilters({ class_id: selectedClassId });
      updateStudentsFilters({ class_id: selectedClassId });
    } else {
      updateRowsFilters({ class_id: undefined });
      updateStudentsFilters({ class_id: undefined });
    }
  }, [isConfigured, selectedClassId, updateRowsFilters, updateStudentsFilters]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Setup screen
  // ─────────────────────────────────────────────────────────────────────────────

  if (!isConfigured) {
    const uniqueMajors = Array.from(
      new Set(allPrograms.map((p) => p.major_name).filter((m): m is string => !!m))
    );
    const selectedClassName = classesForMajor.find((c) => c.id === selectedClassId)?.class_code ?? "";

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white! flex items-center justify-center gap-3">
            <FolderInput className="text-indigo-400! h-8 w-8" />
            Nhập &amp; Quản lý Lớp học
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành và lớp học mục tiêu.
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedMajor(val);
                    setSelectedClassId("");
                    if (!val) setClassesForMajor([]);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
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
                  <div className="flex items-center justify-center gap-2 py-3 bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    Đang tải danh sách lớp...
                  </div>
                ) : (
                  <select
                    value={selectedClassId}
                    disabled={!selectedMajor || classesForMajor.length === 0}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <option className="bg-slate-900 text-slate-500" value="">
                      {!selectedMajor
                        ? "-- Vui lòng chọn chuyên ngành trước --"
                        : classesForMajor.length === 0
                        ? "-- Không tìm thấy lớp học nào --"
                        : "-- Chọn lớp học --"}
                    </option>
                    {classesForMajor.map((c) => (
                      <option className="bg-slate-900 text-slate-100" key={c.id} value={c.id}>
                        {c.class_code}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Preview badge */}
            {selectedClassId && selectedClassName && (
              <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-2 text-xs text-teal-300">
                <span className="font-bold">Lớp đã chọn:</span>
                <span className="font-mono font-semibold text-teal-200">{selectedClassName}</span>
              </div>
            )}

            <button
              onClick={() => { if (selectedClassId) setIsConfigured(true); }}
              disabled={!selectedClassId}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer hover:-translate-y-0.5"
            >
              Vào trang quản lý
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Tab definitions
  // ─────────────────────────────────────────────────────────────────────────────

  const selectedClassName =
    classesForMajor.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "imports",  label: "Phiên nhập lớp",    icon: <FolderInput size={15} /> },
    { key: "rows",     label: "Chi tiết dòng nhập", icon: <ListOrdered size={15} /> },
    { key: "students", label: "Sinh viên",           icon: <GraduationCap size={15} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Main view
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsConfigured(false); setSelectedClassId(""); }}
            className="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white! m-0">
                Nhập &amp; Quản lý Lớp học
              </h1>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-400 border border-teal-500/20 uppercase tracking-wide">
                {selectedClassName}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Đang làm việc với lớp{" "}
              <span className="text-slate-200 font-semibold">{selectedClassName}</span> — chuyên ngành{" "}
              <span className="text-slate-200 font-semibold">{selectedMajor}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-800/80">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all cursor-pointer -mb-px border-b-2 ${
              activeTab === tab.key
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      {activeTab === "imports" && (
        <ImportsTab
          selectedMajor={selectedMajor}
          classesForMajor={classesForMajor}
          allPrograms={allPrograms}
        />
      )}

      {activeTab === "rows" && <RowsTab />}

      {activeTab === "students" && (
        <StudentsTab
          selectedClassId={selectedClassId}
          classesForMajor={classesForMajor}
          allPrograms={allPrograms}
        />
      )}
    </div>
  );
}
