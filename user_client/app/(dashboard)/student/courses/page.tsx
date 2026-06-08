"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  CalendarDays,
  Layers,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
} from "lucide-react";
import { CourseResult } from "./components/CourseTable";
import { GroupSection, KNOWLEDGE_BLOCK_COLORS } from "./components/GroupSection";

interface CurriculumCourse {
  course_code: string;
  course_name: string;
  credits?: number;
  expected_semester?: number;
  knowledge_block: string;
  course_type: string;
}

const KNOWLEDGE_BLOCK_LABELS: Record<string, string> = {
  GENERAL: "Đại cương",
  SECTOR_CORE: "Cơ sở khối ngành",
  MAJOR_CORE: "Cơ sở ngành",
  SPECIALIZED: "Chuyên ngành",
};

const KNOWLEDGE_BLOCK_ORDER = [
  "GENERAL",
  "SECTOR_CORE",
  "MAJOR_CORE",
  "SPECIALIZED",
];


type GroupMode = "semester" | "knowledge";
type SortOrder = "default" | "az" | "za";

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [curriculumMap, setCurriculumMap] = useState<
    Record<string, CurriculumCourse>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [groupMode, setGroupMode] = useState<GroupMode>("semester");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const studentRes = await api.get(`/students?user_id=${user.id}`);
        if (studentRes.data?.length > 0) {
          const profile = studentRes.data[0];

          const [coursesRes, curriculumRes] = await Promise.allSettled([
            api.get(`/student_course_results?student_id=${profile.id}&limit=500`),
            profile.program_id
              ? api.get(
                  `/curriculum_courses?program_id=${profile.program_id}&limit=500`
                )
              : Promise.resolve({ data: [] }),
          ]);

          let mergedCourses: CourseResult[] = [];
          if (coursesRes.status === "fulfilled") {
            mergedCourses = [...(coursesRes.value.data || [])];
          }

          if (curriculumRes.status === "fulfilled") {
            const map: Record<string, CurriculumCourse> = {};
            const list: CurriculumCourse[] =
              curriculumRes.value.data?.data ?? curriculumRes.value.data ?? [];
            list.forEach((cc) => {
              map[cc.course_code] = cc;
            });
            setCurriculumMap(map);
          }
          setCourses(mergedCourses);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const filtered = useMemo(() => {
    const list = courses.filter(
      (c) =>
        !search ||
        c.course_code?.toLowerCase().includes(search.toLowerCase()) ||
        c.course_name?.toLowerCase().includes(search.toLowerCase())
    );
    if (sortOrder === "az")
      return [...list].sort((a, b) =>
        (a.course_name ?? "").localeCompare(b.course_name ?? "", "vi")
      );
    if (sortOrder === "za")
      return [...list].sort((a, b) =>
        (b.course_name ?? "").localeCompare(a.course_name ?? "", "vi")
      );
    return list;
  }, [courses, search, sortOrder]);

  // ── Group by Semester ──────────────────────────────────────────
  const semesterGroups = useMemo(() => {
    const map = new Map<string, CourseResult[]>();
    filtered.forEach((c) => {
      const key =
        c.school_year && c.semester_number != null
          ? `${c.school_year}__${c.semester_number}`
          : "__unknown";
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    });

    // Sort: unknown last, others chronologically
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "__unknown") return 1;
      if (b === "__unknown") return -1;
      const [ayear, asem] = a.split("__");
      const [byear, bsem] = b.split("__");
      if (ayear !== byear) return ayear.localeCompare(byear);
      return Number(asem) - Number(bsem);
    });

    return entries.map(([key, list]) => {
      if (key === "__unknown")
        return { key, title: "Không xác định học kỳ", subtitle: "", list };
      const [year, sem] = key.split("__");
      return {
        key,
        title: `Học kỳ ${sem} — ${year}`,
        subtitle: `${list.length} học phần`,
        list,
      };
    });
  }, [filtered]);

  // ── Group by Knowledge Block ───────────────────────────────────
  const knowledgeGroups = useMemo(() => {
    const map = new Map<string, CourseResult[]>();
    filtered.forEach((c) => {
      const cc = curriculumMap[c.course_code];
      const block = cc?.knowledge_block ?? "UNKNOWN";
      const arr = map.get(block) ?? [];
      arr.push(c);
      map.set(block, arr);
    });

    const order = [...KNOWLEDGE_BLOCK_ORDER, "UNKNOWN"];
    const entries = Array.from(map.entries()).sort(
      ([a], [b]) => order.indexOf(a) - order.indexOf(b)
    );

    return entries.map(([block, list]) => ({
      key: block,
      block,
      title: KNOWLEDGE_BLOCK_LABELS[block] ?? "Khác",
      list,
    }));
  }, [filtered, curriculumMap]);

  const passed = courses.filter((c) => c.status === "PASSED").length;
  const failed = courses.filter((c) => c.status === "FAILED").length;
  const totalCredits = courses
    .filter((c) => c.status === "PASSED")
    .reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500">
            Đang tải danh sách môn học...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
          <BookOpen size={12} />
          <span>Kết quả Học tập</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
          Danh sách Môn học
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Toàn bộ học phần bóc tách từ bảng điểm tích lũy, có thể xem theo học
          kỳ hoặc theo khối kiến thức.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Đã đạt",
            value: passed,
            icon: <CheckCircle2 size={18} className="text-emerald-600" />,
            color: "bg-emerald-50 border-emerald-100 text-emerald-700",
          },
          {
            label: "Không đạt",
            value: failed,
            icon: <XCircle size={18} className="text-red-500" />,
            color: "bg-red-50 border-red-100 text-red-700",
          },
          {
            label: "Tín chỉ tích lũy",
            value: totalCredits,
            icon: <BookOpen size={18} className="text-violet-600" />,
            color: "bg-violet-50 border-violet-100 text-violet-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${s.color}`}
          >
            {s.icon}
            <div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-400">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">
            Chưa có dữ liệu môn học
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            Vui lòng nhập bảng điểm tại mục{" "}
            <strong>Bảng điểm &amp; Transcript</strong> để hệ thống bóc tách
            kết quả học tập.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar: Search + Group toggle */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm">
            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Tìm theo mã môn hoặc tên môn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              {/* Sort dropdown */}
              <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
                <button
                  onClick={() => setSortOrder("default")}
                  title="Thứ tự mặc định"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortOrder === "default"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <ArrowUpDown size={13} />
                  Mặc định
                </button>
                <button
                  onClick={() => setSortOrder("az")}
                  title="Sắp xếp A → Z"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortOrder === "az"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <ArrowUpAZ size={13} />
                  A → Z
                </button>
                <button
                  onClick={() => setSortOrder("za")}
                  title="Sắp xếp Z → A"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    sortOrder === "za"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <ArrowDownAZ size={13} />
                  Z → A
                </button>
              </div>

              {/* Group mode toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
                <button
                  onClick={() => setGroupMode("semester")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    groupMode === "semester"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <CalendarDays size={13} />
                  Theo học kỳ
                </button>
                <button
                  onClick={() => setGroupMode("knowledge")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    groupMode === "knowledge"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200"
                      : "text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  <Layers size={13} />
                  Theo khối kiến thức
                </button>
              </div>
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-3">
            {groupMode === "semester" &&
              semesterGroups.map((g, i) => (
                <GroupSection
                  key={g.key}
                  title={g.title}
                  subtitle={g.subtitle}
                  courses={g.list}
                  colorScheme={{
                    bg: i % 2 === 0 ? "bg-indigo-50" : "bg-violet-50",
                    text: i % 2 === 0 ? "text-indigo-700" : "text-violet-700",
                    border:
                      i % 2 === 0 ? "border-indigo-200" : "border-violet-200",
                    badge:
                      i % 2 === 0
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "bg-violet-100 text-violet-700 border-violet-200",
                  }}
                  defaultOpen={i === 0}
                />
              ))}

            {groupMode === "knowledge" &&
              knowledgeGroups.map((g, i) => (
                <GroupSection
                  key={g.key}
                  title={g.title}
                  courses={g.list}
                  colorScheme={
                    KNOWLEDGE_BLOCK_COLORS[g.block] ??
                    KNOWLEDGE_BLOCK_COLORS["UNKNOWN"]
                  }
                  defaultOpen={i === 0}
                />
              ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-neutral-400 text-xs bg-white border border-zinc-200 rounded-2xl">
                Không tìm thấy môn học phù hợp.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
