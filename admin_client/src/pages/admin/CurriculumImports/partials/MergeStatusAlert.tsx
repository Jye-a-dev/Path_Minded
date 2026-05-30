import { Loader2, CheckCircle2 } from "lucide-react";

interface MergeStatusAlertProps {
  mergeStatus: string | null;
}

export function MergeStatusAlert({ mergeStatus }: MergeStatusAlertProps) {
  if (!mergeStatus) return null;

  const isError = mergeStatus.startsWith("Lỗi");
  const isLoading = mergeStatus.startsWith("Đang");

  return (
    <div
      className={`rounded-lg p-4 text-xs font-semibold border flex items-center gap-2 ${
        isError
          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
          : isLoading
          ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      }`}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <CheckCircle2 size={14} />
      )}
      <span>{mergeStatus}</span>
    </div>
  );
}
