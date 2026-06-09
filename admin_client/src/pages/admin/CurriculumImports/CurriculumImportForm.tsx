import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { UploadCloud, FileText, Loader2, Search } from "lucide-react";

interface ProgramItem {
  id: string;
  program_code: string;
  program_name: string;
  major_name: string | null;
  version: string | null;
}

interface CurriculumImportFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  defaultProgramId?: string;
  defaultMajor?: string;
}

export const CurriculumImportForm: React.FC<CurriculumImportFormProps> = ({
  onSubmit,
  onCancel,
  defaultProgramId,
  defaultMajor,
}) => {
  const [sourceType, setSourceType] = useState<"file" | "text">("text");
  const [formProgramId, setFormProgramId] = useState("");
  const [formTextContent, setFormTextContent] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formNote, setFormNote] = useState("");

  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=200");
        const list: ProgramItem[] = response.data || [];
        setPrograms(list);

        // Extract unique majors
        const uniqueMajors = Array.from(
          new Set(
            list
              .map((p) => p.major_name?.trim())
              .filter((m): m is string => !!m)
          )
        ).sort();
        setMajors(uniqueMajors);

        if (defaultProgramId) {
          setFormProgramId(defaultProgramId);
          const found = list.find((p) => p.id === defaultProgramId);
          if (found && found.major_name) {
            setSelectedMajor(found.major_name);
          }
        } else if (defaultMajor) {
          setSelectedMajor(defaultMajor);
        }
      } catch (e) {
        console.error("Failed to load education program list:", e);
      } finally {
        setLoadingPrograms(false);
      }
    };

    loadPrograms();
  }, [defaultProgramId, defaultMajor]);

  // Filter programs based on selected major
  const filteredPrograms = programs.filter((p) => {
    if (!selectedMajor) return false;
    return p.major_name?.trim() === selectedMajor;
  });

  const displayedPrograms = filteredPrograms.filter((p) => {
    if (!searchQuery.trim()) return true;
    const lowerQuery = searchQuery.toLowerCase().trim();
    return (
      p.program_code.toLowerCase().includes(lowerQuery) ||
      p.program_name.toLowerCase().includes(lowerQuery) ||
      (p.version && p.version.toLowerCase().includes(lowerQuery))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("programId", formProgramId);
      formData.append("note", formNote);

      if (sourceType === "file" && formFile) {
        formData.append("file", formFile);
      } else if (sourceType === "text") {
        formData.append("textContent", formTextContent);
      } else {
        setFormError("Vui lòng tải lên tệp hoặc nhập nội dung văn bản.");
        setSubmitting(false);
        return;
      }

      await onSubmit(formData);
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(errObj.response?.data?.message || errObj.message || "Gửi phiên nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-400 border border-rose-500/20">
          {formError}
        </div>
      )}

      {loadingPrograms ? (
        <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-xs">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải chương trình đào tạo...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Major Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Ngành học (Major)
            </label>
            <select
              value={selectedMajor}
              required
              disabled={!!defaultProgramId || !!defaultMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value);
                setFormProgramId(""); // reset program when major changes
                setSearchQuery(""); // reset search query
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-50"
            >
              <option className="bg-slate-900 text-slate-100" value="">-- Chọn ngành học --</option>
              {majors.map((m) => (
                <option className="bg-slate-900 text-slate-100" key={m} value={m}>
                  {m}
                </option>
              ))}
              {majors.length === 0 && (
                <option className="bg-slate-900 text-slate-100" value="default">Chương trình chung (General)</option>
              )}
            </select>
          </div>

          {/* Program Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Chương trình đào tạo (Program)
            </label>
            {selectedMajor && filteredPrograms.length > 5 && (
              <div className="relative flex items-center">
                <Search size={12} className="absolute left-2.5 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm nhanh chương trình..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>
            )}
            <select
              disabled={!!defaultProgramId || !selectedMajor}
              value={formProgramId}
              required
              onChange={(e) => setFormProgramId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option className="bg-slate-900 text-slate-100" value="">
                {displayedPrograms.length === 0 && searchQuery
                  ? "Không tìm thấy chương trình nào phù hợp"
                  : "-- Chọn chương trình --"}
              </option>
              {displayedPrograms.map((p) => (
                <option className="bg-slate-900 text-slate-100" key={p.id} value={p.id}>
                  {p.program_name} {p.version ? `(Phiên bản ${p.version})` : ""} - {p.program_code}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Loại nguồn
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSourceType("text")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              sourceType === "text"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText size={16} />
            Dán văn bản thô
          </button>
          <button
            type="button"
            onClick={() => setSourceType("file")}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition cursor-pointer ${
              sourceType === "file"
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            <UploadCloud size={16} />
            Tải tệp Excel lên
          </button>
        </div>
      </div>

      {sourceType === "text" ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Nội dung chương trình học</span>
            <span className="text-[10px] lowercase text-slate-500">Định dạng CSV: mã,tên,số_tín_chỉ,học_kỳ,nhóm,loại</span>
          </label>
          <textarea
            placeholder="CS101,Introduction to Computer Science,3,1,General,REQUIRED&#10;CS102,Calculus I,3,1,General,REQUIRED"
            value={formTextContent}
            required
            onChange={(e) => setFormTextContent(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder-slate-650 focus:border-indigo-500 focus:outline-none transition-all h-36 font-mono resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Chọn bảng tính Excel (.xlsx)
          </label>
          <input
            type="file"
            accept=".xlsx, .xls"
            required
            onChange={(e) => setFormFile(e.target.files?.[0] || null)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-400 focus:border-indigo-500 focus:outline-none transition-all"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Ghi chú kiểm định
        </label>
        <input
          type="text"
          placeholder="Ví dụ: Nhập ma trận đề cương chuẩn v1.0"
          value={formNote}
          onChange={(e) => setFormNote(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none transition-all"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Bắt đầu phiên nhập
        </button>
      </div>
    </form>
);
};
