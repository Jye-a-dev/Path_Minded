interface HoursInputFieldsProps {
  theoryHours: number | "";
  setTheoryHours: (val: number | "") => void;
  practiceHours: number | "";
  setPracticeHours: (val: number | "") => void;
  projectHours: number | "";
  setProjectHours: (val: number | "") => void;
  internshipHours: number | "";
  setInternshipHours: (val: number | "") => void;
}

export function HoursInputFields({
  theoryHours,
  setTheoryHours,
  practiceHours,
  setPracticeHours,
  projectHours,
  setProjectHours,
  internshipHours,
  setInternshipHours,
}: HoursInputFieldsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Giờ LT (Lý thuyết)
        </label>
        <input
          type="number"
          placeholder="Ví dụ: 30"
          value={theoryHours}
          onChange={(e) =>
            setTheoryHours(e.target.value !== "" ? Number(e.target.value) : "")
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Giờ TH (Thực hành)
        </label>
        <input
          type="number"
          placeholder="Ví dụ: 15"
          value={practiceHours}
          onChange={(e) =>
            setPracticeHours(e.target.value !== "" ? Number(e.target.value) : "")
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Giờ ĐA (Đồ án)
        </label>
        <input
          type="number"
          placeholder="Ví dụ: 0"
          value={projectHours}
          onChange={(e) =>
            setProjectHours(e.target.value !== "" ? Number(e.target.value) : "")
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Giờ TT (Thực tập)
        </label>
        <input
          type="number"
          placeholder="Ví dụ: 0"
          value={internshipHours}
          onChange={(e) =>
            setInternshipHours(e.target.value !== "" ? Number(e.target.value) : "")
          }
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>
    </div>
  );
}
