import React from "react";
import { CourseResult } from "./CourseTable";
import {
  isPeOrDefenseCourse,
  isPrepEnglishCourse,
} from "../../simulator/components/simulatorMath";

export function GroupAnalytics({ courses }: { courses: CourseResult[] }) {
  const total = courses.length;
  const passed = courses.filter((c) => c.status === "PASSED");
  const failed = courses.filter((c) => c.status === "FAILED");
  const studying = courses.filter((c) => c.status === "STUDYING");

  const registeredCredits = courses.reduce(
    (s, c) => s + (Number(c.credits) || 0),
    0
  );

  // Exclude PE/Defense and prep English from passed credits and GPA
  const validPassed = passed.filter(
    (c) =>
      !isPeOrDefenseCourse(c.course_code, c.course_name || "", []) &&
      !isPrepEnglishCourse(c.course_code, c.course_name || "")
  );

  const passedCredits = validPassed.reduce(
    (s, c) => s + (Number(c.credits) || 0),
    0
  );

  // Weighted GPA (score_4) on passed courses with credits
  const gpaData = validPassed.filter(
    (c) => c.score_4 != null && Number(c.credits) > 0
  );
  const gpa =
    gpaData.length > 0
      ? gpaData.reduce(
          (s, c) => s + Number(c.score_4) * Number(c.credits),
          0
        ) / gpaData.reduce((s, c) => s + Number(c.credits), 0)
      : null;

  const passRate = total > 0 ? Math.round((passed.length / total) * 100) : 0;

  // Letter grade distribution (passed only)
  const gradeMap: Record<string, number> = {};
  passed.forEach((c) => {
    const g = c.letter_grade || "?";
    gradeMap[g] = (gradeMap[g] ?? 0) + 1;
  });
  const gradeOrder = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F", "?"];
  const gradeEntries = Object.entries(gradeMap).sort(
    ([a], [b]) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b)
  );

  const gradeColor: Record<string, string> = {
    "A+": "bg-emerald-500",
    A: "bg-emerald-400",
    "B+": "bg-teal-400",
    B: "bg-teal-300",
    "C+": "bg-amber-400",
    C: "bg-amber-300",
    "D+": "bg-orange-400",
    D: "bg-orange-300",
    F: "bg-red-400",
    "?": "bg-zinc-300",
  };

  return (
    <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/60">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {
            label: "TC đăng ký",
            value: registeredCredits,
            sub: "tín chỉ",
            color: "text-neutral-700",
          },
          {
            label: "TC tích lũy",
            value: passedCredits,
            sub: "tín chỉ",
            color: "text-emerald-600",
          },
          {
            label: "GPA kỳ này",
            value: gpa != null ? gpa.toFixed(2) : "—",
            sub: "/ 4.0",
            color: gpa != null && gpa >= 3.2
              ? "text-emerald-600"
              : gpa != null && gpa >= 2.5
              ? "text-amber-600"
              : "text-red-500",
          },
          {
            label: "Tỉ lệ đạt",
            value: `${passRate}%`,
            sub: `${passed.length}/${total} môn`,
            color:
              passRate >= 80
                ? "text-emerald-600"
                : passRate >= 60
                ? "text-amber-600"
                : "text-red-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-zinc-200 px-3 py-2.5 flex flex-col gap-0.5 shadow-sm"
          >
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
              {s.label}
            </span>
            <span className={`text-lg font-extrabold ${s.color} leading-tight`}>
              {s.value}
            </span>
            <span className="text-[9px] text-neutral-400">{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Pass-rate bar */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
              Kết quả học kỳ
            </span>
            <span className="text-[9px] text-neutral-400">
              {passed.length} đạt · {failed.length} rớt
              {studying.length > 0 ? ` · ${studying.length} đang học` : ""}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-zinc-200 overflow-hidden flex">
            {passed.length > 0 && (
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${(passed.length / total) * 100}%` }}
              />
            )}
            {studying.length > 0 && (
              <div
                className="h-full bg-amber-300 transition-all duration-500"
                style={{ width: `${(studying.length / total) * 100}%` }}
              />
            )}
            {failed.length > 0 && (
              <div
                className="h-full bg-red-400 transition-all duration-500"
                style={{ width: `${(failed.length / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {[
              { label: "Đạt", color: "bg-emerald-400" },
              { label: "Đang học", color: "bg-amber-300" },
              { label: "Rớt", color: "bg-red-400" },
            ].map((l) => (
              <span
                key={l.label}
                className="flex items-center gap-1 text-[9px] text-neutral-400"
              >
                <span className={`inline-block w-2 h-2 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Grade distribution */}
        {gradeEntries.length > 0 && (
          <div className="shrink-0">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Phân bổ điểm chữ
            </span>
            <div className="flex items-end gap-1 h-10">
              {gradeEntries.map(([g, count]) => (
                <div
                  key={g}
                  className="flex flex-col items-center gap-0.5"
                  title={`${g}: ${count} môn`}
                >
                  <span className="text-[8px] text-neutral-400 font-bold">
                    {count}
                  </span>
                  <div
                    className={`w-5 rounded-sm ${gradeColor[g] ?? "bg-zinc-300"} transition-all duration-500`}
                    style={{
                      height: `${Math.max(4, (count / passed.length) * 28)}px`,
                    }}
                  />
                  <span className="text-[8px] text-neutral-500 font-mono font-bold">
                    {g}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
