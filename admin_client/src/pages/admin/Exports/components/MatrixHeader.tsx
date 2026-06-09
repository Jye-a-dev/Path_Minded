import { TableProperties, Loader2, Download } from "lucide-react";

interface MatrixHeaderProps {
  activeClassCode: string;
  selectedAdvisorId: string;
  activeAdvisorObj: { id: string; label: string } | undefined;
  setViewMatrix: (val: boolean) => void;
  handleDownloadExcel: () => void;
  downloading: boolean;
}

export function MatrixHeader({
  activeClassCode,
  selectedAdvisorId,
  activeAdvisorObj,
  setViewMatrix,
  handleDownloadExcel,
  downloading,
}: MatrixHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md">
      <div className="flex items-center gap-3.5">
        <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
          <TableProperties size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-400 tracking-wide uppercase bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
              Lớp: {activeClassCode}
            </span>
            {selectedAdvisorId && (
              <span className="text-sm font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                CVHT: {activeAdvisorObj?.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đang hiển thị ma trận kiểm định tiến trình học tập của sinh viên lớp {activeClassCode}.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setViewMatrix(false)}
          className="w-full md:w-auto rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition-all cursor-pointer"
        >
          Thay đổi lớp / cố vấn
        </button>
        <button
          onClick={handleDownloadExcel}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-lg transition cursor-pointer"
        >
          {downloading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          Tải Excel
        </button>
      </div>
    </div>
  );
}
