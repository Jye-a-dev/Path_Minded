import React, { useState } from "react";
import { Layers, FileSpreadsheet, FileText, Upload, Trash2, ArrowLeft } from "lucide-react";
import { Program } from "./ProgramSelector";

interface UploadPhaseProps {
  selectedProgramDetails: Program | undefined;
  onBack: () => void;
  onSubmit: (file: File | null, textContent: string, sheetIndex: number) => Promise<void>;
}

export default function UploadPhase({
  selectedProgramDetails,
  onBack,
  onSubmit
}: UploadPhaseProps) {
  const [activeTab, setActiveTab] = useState<"excel" | "paste">("excel");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "excel" && !file) {
      alert("Vui lòng tải lên tệp tin Excel!");
      return;
    }
    if (activeTab === "paste" && !textContent.trim()) {
      alert("Vui lòng dán dữ liệu văn bản thô!");
      return;
    }
    await onSubmit(activeTab === "excel" ? file : null, activeTab === "excel" ? "" : textContent, sheetIndex);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'xlsx' || extension === 'xls') {
        setFile(droppedFile);
      } else {
        alert("Chỉ chấp nhận tệp tin Excel (.xlsx, .xls)!");
      }
    }
  };

  const triggerFileSelect = () => {
    document.getElementById("file-upload-input")?.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Selected Program Alert */}
      <div className="flex items-center justify-between p-4 bg-emerald-50/60 backdrop-blur-xs border border-emerald-100/80 rounded-2xl relative z-10 transition-all duration-300 hover:bg-emerald-50/80">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/10">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-800 tracking-wide">
              {selectedProgramDetails?.program_name}
            </p>
            <p className="text-[10px] font-mono text-emerald-650 uppercase tracking-wider mt-0.5">
              Mã CTĐT: {selectedProgramDetails?.program_code}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-100/50 transition cursor-pointer"
        >
          <ArrowLeft size={12} />
          Thay đổi
        </button>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md border border-zinc-200 rounded-3xl shadow-xl p-8 space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-5">
          <h3 className="text-md font-extrabold text-neutral-900 tracking-tight">Phương pháp nhập dữ liệu</h3>
          
          {/* Custom Navigation Tabs */}
          <div className="flex bg-neutral-100 border border-zinc-200 rounded-xl p-1 font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("excel");
                setTextContent("");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
                activeTab === "excel"
                  ? "bg-white text-emerald-800 shadow-sm border border-zinc-150"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <FileSpreadsheet size={13} />
              Tải lên Excel
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("paste");
                setFile(null);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg transition-all cursor-pointer ${
                activeTab === "paste"
                  ? "bg-white text-emerald-800 shadow-sm border border-zinc-150"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <FileText size={13} />
              Dán dữ liệu thô
            </button>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === "excel" ? (
          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/20"
                    : "border-zinc-300 bg-neutral-50/30 hover:border-zinc-400 hover:bg-neutral-50/60"
                }`}
              >
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600">
                  <Upload size={24} className="animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-neutral-800">Tải lên tệp khung chương trình</p>
                  <p className="text-xs text-neutral-400">
                    Kéo và thả tệp Excel của bạn vào đây hoặc <span className="text-emerald-600 underline font-semibold">chọn từ máy tính</span>
                  </p>
                </div>
                <p className="text-[10px] text-neutral-400 font-medium">Hỗ trợ định dạng `.xls`, `.xlsx`</p>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="border border-zinc-200 bg-neutral-50/50 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-800 truncate max-w-sm">{file.name}</p>
                    <p className="text-[10px] font-semibold text-neutral-400 font-mono mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition cursor-pointer"
                  title="Xóa tệp tin"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Sheet Index input */}
            <div className="space-y-1.5 p-4 bg-neutral-50 rounded-2xl border border-zinc-150 w-full sm:w-fit">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                Trang tính Excel cần phân tích (Sheet Index)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={sheetIndex}
                  onChange={(e) => setSheetIndex(Number(e.target.value))}
                  className="border border-zinc-200 rounded-xl px-3.5 py-2 text-sm font-mono w-28 focus:outline-none focus:border-emerald-500 bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all"
                />
                <span className="text-xs text-neutral-450 font-medium italic">
                  (Mặc định 0 là trang đầu tiên)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-mono">
                Dán nội dung văn bản thô
              </label>
              <textarea
                placeholder="Sao chép các dòng cột từ Excel hoặc Website đào tạo và dán vào đây...&#10;Ví dụ:&#10;COMP101 | Nhập môn lập trình | 3 tín chỉ | Đại cương&#10;COMP102 | Cấu trúc dữ liệu | 4 tín chỉ | Cơ sở ngành..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={8}
                className="w-full border border-zinc-200 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-emerald-500 bg-neutral-50/30 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all leading-relaxed"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-150">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl px-5 py-2.5 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-550 text-xs font-bold transition cursor-pointer active:scale-98"
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="rounded-xl px-6 py-2.5 bg-emerald-600 hover:bg-emerald-55 active:scale-98 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
          >
            Bắt đầu phân tích
          </button>
        </div>
      </form>
    </div>
  );
}
