"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { useReloadPersistentState } from "@/hooks/useReloadPersistentState";
import {
  FolderInput,
  Loader2,
  ChevronLeft,
  GraduationCap,
  ListOrdered,
  AlertCircle
} from "lucide-react";

import { ClassItem, ProgramItem } from "./types";
import ImportsTabPane from "./components/ImportsTabPane";
import RowsTabPane from "./components/RowsTabPane";
import StudentsTabPane from "./components/StudentsTabPane";

export default function AdvisorClassImportsPage() {
  const { user } = useAuth();

  // Configuration States (Using useReloadPersistentState for refresh persistence)
  const [isConfigured, setIsConfigured] = useReloadPersistentState("advisor_class_imports_isConfigured", false);
  const [selectedMajor, setSelectedMajor] = useReloadPersistentState("advisor_class_imports_selectedMajor", "");
  const [selectedClassId, setSelectedClassId] = useReloadPersistentState("advisor_class_imports_selectedClassId", "");

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [currentAdvisor, setCurrentAdvisor] = useState<{ id: string; full_name: string; department?: string | null } | null>(null);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useReloadPersistentState<"imports" | "rows" | "students">("advisor_class_imports_activeTab", "imports");
  const [refreshKey, setRefreshKey] = useState(0);

  // Custom Modal States
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  // Fetch advisor, programs and classes
  useEffect(() => {
    const fetchConfigData = async () => {
      if (!user) return;
      setLoadingConfig(true);
      try {
        const advRes = await api.get(`/advisors?user_id=${user.id}`);
        if (advRes.data && advRes.data.length > 0) {
          const advRec = advRes.data[0];
          setCurrentAdvisor(advRec);

          // Get advisor's classes
          setLoadingClasses(true);
          const classesRes = await api.get(`/classes?advisor_id=${advRec.id}&limit=500`);
          setClasses(classesRes.data || []);
          setLoadingClasses(false);
        }

        const programsRes = await api.get("/programs?limit=250");
        setAllPrograms(programsRes.data || []);
      } catch (err) {
        console.error("Failed to load configuration details:", err);
      } finally {
        setLoadingConfig(false);
      }
    };
    void fetchConfigData();
  }, [user]);

  // Derive unique majors from programs associated with advisor's classes
  const uniqueMajors = useMemo(() => {
    const programIds = new Set(classes.map((c) => c.program_id).filter(Boolean));
    const majors = allPrograms
      .filter((p) => programIds.has(p.id))
      .map((p) => p.major_name)
      .filter((m): m is string => !!m);
    return Array.from(new Set(majors)).sort();
  }, [classes, allPrograms]);

  // Sync selectedMajor with advisor's department (case/accent insensitive match)
  useEffect(() => {
    if (!currentAdvisor?.department || uniqueMajors.length === 0) return;

    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/\s+/g, " ")
        .trim();
    };

    const targetDept = currentAdvisor.department;
    const matched = uniqueMajors.find(
      (m) => normalizeString(m) === normalizeString(targetDept)
    );

    if (matched) {
      if (selectedMajor !== matched && (user?.role === "ADVISOR" || !selectedMajor)) {
        setSelectedMajor(matched);
      }
    } else {
      if (selectedMajor !== targetDept && (user?.role === "ADVISOR" || !selectedMajor)) {
        setSelectedMajor(targetDept);
      }
    }
  }, [currentAdvisor, uniqueMajors, user, selectedMajor, setSelectedMajor]);

  // Filter classes based on selected major
  const classesForMajor = useMemo(() => {
    if (!selectedMajor) return [];
    const programIdsForMajor = new Set(
      allPrograms.filter((p) => p.major_name === selectedMajor).map((p) => p.id)
    );
    return classes.filter((c) => c.program_id && programIdsForMajor.has(c.program_id));
  }, [selectedMajor, classes, allPrograms]);

  const selectedClassCode = useMemo(() => {
    const found = classes.find((c) => c.id === selectedClassId);
    return found ? found.class_code : selectedClassId;
  }, [selectedClassId, classes]);

  if (loadingConfig) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải dữ liệu cấu hình...
          </p>
        </div>
      </div>
    );
  }

  if (!currentAdvisor) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Không tìm thấy hồ sơ Cố vấn</h1>
        <p className="text-sm text-neutral-500">
          Tài khoản của bạn chưa được liên kết với hồ sơ Cố vấn học tập nào.
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Setup Screen (Config Phase)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isConfigured) {
    return (
      <div className="space-y-8 max-w-xl mx-auto py-12">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-2">
            <FolderInput size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Nhập &amp; Quản lý lớp sinh viên
          </h1>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto">
            Vui lòng cấu hình phiên làm việc bằng cách chọn chuyên ngành và lớp học bạn phụ trách.
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-linear-to-r from-emerald-500 to-teal-500" />
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Chuyên ngành</label>
              <select
                value={selectedMajor}
                disabled={user?.role === "ADVISOR" && !!currentAdvisor?.department}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setSelectedClassId("");
                }}
                className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-semibold disabled:opacity-75 disabled:bg-neutral-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn chuyên ngành --</option>
                {uniqueMajors.map((major) => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Lớp học mục tiêu</label>
              {loadingClasses ? (
                <div className="flex items-center gap-2 py-2 border border-zinc-200 rounded-xl px-3 text-xs text-neutral-400">
                  <Loader2 size={12} className="animate-spin text-emerald-600" />
                  <span>Đang tải danh sách lớp...</span>
                </div>
              ) : (
                <select
                  value={selectedClassId}
                  disabled={!selectedMajor || classesForMajor.length === 0}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:border-emerald-500 font-bold disabled:opacity-50"
                >
                  <option value="">
                    {!selectedMajor 
                      ? "-- Chọn chuyên ngành trước --" 
                      : classesForMajor.length === 0 
                      ? "-- Không tìm thấy lớp học phù hợp --" 
                      : "-- Chọn lớp học --"}
                  </option>
                  {classesForMajor.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_code}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedClassId}
            onClick={() => setIsConfigured(true)}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-55 text-white font-bold py-2.5 text-xs shadow-lg shadow-emerald-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Vào bảng quản lý nhập liệu
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main Panel (Configured Phase)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfigured(false);
              setSelectedClassId("");
              setActiveTab("imports");
            }}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-550 transition cursor-pointer"
            title="Quay lại chọn cấu hình"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
                Nhập lớp học
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                {selectedMajor}
              </span>
              <span className="inline-flex items-center rounded-full bg-teal-100/70 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                Lớp: {selectedClassCode}
              </span>
            </div>
            <p className="text-xs text-neutral-550">
              Quản lý tài liệu bóc tách và phân phối sinh viên cho lớp <span className="font-extrabold text-neutral-700 underline">{selectedClassCode}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {(["imports", "rows", "students"] as const).map((tab) => {
          const labels = {
            imports: "Phiên nhập lớp",
            rows: "Chi tiết dòng nhập",
            students: "Sinh viên hiện tại"
          };
          const icons = {
            imports: <FolderInput size={13} />,
            rows: <ListOrdered size={13} />,
            students: <GraduationCap size={13} />
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer -mb-px border-b-2 ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-neutral-450 hover:text-neutral-600"
              }`}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-4">
        {activeTab === "imports" && (
          <ImportsTabPane
            classId={selectedClassId}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
          />
        )}
        {activeTab === "rows" && (
          <RowsTabPane
            classId={selectedClassId}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
          />
        )}
        {activeTab === "students" && (
          <StudentsTabPane
            classId={selectedClassId}
            classesList={classes}
            allPrograms={allPrograms}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
            setNotification={setNotification}
          />
        )}
      </div>

      {/* Custom Alert/Notification Modal */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-zinc-200 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-150 text-neutral-900 font-semibold text-xs">
            <div className="p-6 border-b border-zinc-150 flex items-center gap-2.5">
              {notification.type === "success" ? (
                <FolderInput className="text-emerald-600 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="text-rose-600 h-5 w-5 shrink-0" />
              )}
              <h3 className={`text-sm font-extrabold uppercase tracking-wide ${notification.type === "success" ? "text-emerald-650" : "text-rose-600"}`}>
                {notification.title}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-neutral-500 leading-relaxed font-semibold">
                {notification.message}
              </p>
            </div>
            <div className="p-6 border-t border-zinc-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setNotification(null)}
                className={`rounded-xl px-5 py-2 font-bold cursor-pointer transition text-white ${notification.type === "success" ? "bg-emerald-600 hover:bg-emerald-55 shadow-lg shadow-emerald-600/10" : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/10"}`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
