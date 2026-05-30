interface PrerequisiteInputFieldsProps {
  prerequisite: string;
  setPrerequisite: (val: string) => void;
  corequisite: string;
  setCorequisite: (val: string) => void;
  organizingSemester: string;
  setOrganizingSemester: (val: string) => void;
}

export function PrerequisiteInputFields({
  prerequisite,
  setPrerequisite,
  corequisite,
  setCorequisite,
  organizingSemester,
  setOrganizingSemester,
}: PrerequisiteInputFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          ĐK tiên quyết
        </label>
        <input
          type="text"
          placeholder="Mã môn học tiên quyết"
          value={prerequisite}
          onChange={(e) => setPrerequisite(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Môn học trước
        </label>
        <input
          type="text"
          placeholder="Mã môn học trước"
          value={corequisite}
          onChange={(e) => setCorequisite(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all font-mono"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Học kỳ tổ chức
        </label>
        <input
          type="text"
          placeholder="Ví dụ: 1, 2, 3"
          value={organizingSemester}
          onChange={(e) => setOrganizingSemester(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>
    </div>
  );
}
