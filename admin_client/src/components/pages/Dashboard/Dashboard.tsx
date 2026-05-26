import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import {
  Users,
  Briefcase,
  BookOpen,
  Building2,
  GraduationCap,
  TrendingUp,
  UploadCloud,
  FileUp,
  DownloadCloud,
  Loader2
} from "lucide-react";

interface Stats {
  users: number;
  advisors: number;
  programs: number;
  classes: number;
  students: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    advisors: 0,
    programs: 0,
    classes: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, advisorsRes, programsRes, classesRes, studentsRes] = await Promise.all([
          api.get("/users/count").catch(() => ({ data: { count: 0 } })),
          api.get("/advisors/count").catch(() => ({ data: { count: 0 } })),
          api.get("/programs/count").catch(() => ({ data: { count: 0 } })),
          api.get("/classes/count").catch(() => ({ data: { count: 0 } })),
          api.get("/students/count").catch(() => ({ data: { count: 0 } })),
        ]);

        setStats({
          users: usersRes.data?.count ?? 0,
          advisors: advisorsRes.data?.count ?? 0,
          programs: programsRes.data?.count ?? 0,
          classes: classesRes.data?.count ?? 0,
          students: studentsRes.data?.count ?? 0,
        });
      } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: Users,
      color: "from-blue-600/20 to-blue-500/10 text-blue-400 border-blue-500/20",
    },
    {
      label: "Academic Advisors",
      value: stats.advisors,
      icon: Briefcase,
      color: "from-amber-600/20 to-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      label: "Education Programs",
      value: stats.programs,
      icon: BookOpen,
      color: "from-purple-600/20 to-purple-500/10 text-purple-400 border-purple-500/20",
    },
    {
      label: "Active Classes",
      value: stats.classes,
      icon: Building2,
      color: "from-pink-600/20 to-pink-500/10 text-pink-400 border-pink-500/20",
    },
    {
      label: "Total Students",
      value: stats.students,
      icon: GraduationCap,
      color: "from-emerald-600/20 to-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white m-0">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-slate-400">
          Realtime metrics and status of the academic advising matrix database system.
        </p>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border bg-linear-to-br p-6 shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] ${card.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {card.label}
                    </span>
                    <Icon className="h-5 w-5 opacity-80" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-white">
                      {card.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Action Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Imports Manager shortcuts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                Data Ingestion Pipelines
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Easily run new import sessions for curriculum spreadsheets or transcript reports.
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/admin/curriculum_imports"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-5 w-5 text-indigo-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Import Curriculum (Excel)</p>
                      <p className="text-[10px] text-slate-500">Map course syllabus & requisites</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-400">Launch &rarr;</span>
                </Link>

                <Link
                  to="/admin/transcript_uploads"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileUp className="h-5 w-5 text-indigo-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Upload Transcripts</p>
                      <p className="text-[10px] text-slate-500">Parse pasted student results sheets</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-indigo-400">Launch &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Matrix Export shortcuts */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <DownloadCloud className="h-5 w-5 text-emerald-400" />
                Reporting & Export Center
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Trigger structural audit exports to visualize academic advising matrices.
              </p>
              <div className="mt-6 space-y-3">
                <Link
                  to="/admin/exports"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <DownloadCloud className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Run Matrix Audit Export</p>
                      <p className="text-[10px] text-slate-500">Generate advising matrix documents</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">Run &rarr;</span>
                </Link>

                <Link
                  to="/admin/export_logs"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 hover:bg-slate-800/40 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-200">Class Progress Metrics</p>
                      <p className="text-[10px] text-slate-500">View progress logs by class & student</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-400">View &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
