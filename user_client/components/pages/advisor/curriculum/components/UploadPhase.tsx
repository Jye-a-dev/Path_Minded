import React, { useState } from "react";
import { Layers, FileSpreadsheet, FileText } from "lucide-react";
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
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [sheetIndex, setSheetIndex] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !textContent.trim()) {
      alert("Vui lòng tải lên tệp tin Excel hoặc dán dữ liệu văn bản!");
      return;
    }
    await onSubmit(file, textContent, sheetIndex);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Selected Program Alert */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-650 text-white rounded-lg">
            <Layers size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800">
              {selectedProgramDetails?.program_name}
            </p>
            <p className="text-[10px] font-mono text-emerald-600 uppercase">
              Mã CTĐT: {selectedProgramDetails?.program_code}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-xs text-emerald-700 hover:underline font-bold"
        >
          Thay đổi
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
        <h3 className="text-md font-bold text-neutral-900">Phương pháp nhập dữ liệu</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Upload File */}
          <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-neutral-50/30">
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50 rounded-xl w-fit text-emerald-600">
                <FileSpreadsheet size={22} />
              </div>
              <h4 className="text-sm font-bold text-neutral-800">Tải lên tệp Excel</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hỗ trợ tệp bảng tính `.xls`, `.xlsx`. Vui lòng tải đúng file cấu trúc chuẩn.
              </p>
            </div>
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setTextContent("");
                }
              }}
              className="text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
            />
          </div>

          {/* Option B: Text Area */}
          <div className="border border-zinc-200 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-neutral-50/30">
            <div className="space-y-2">
              <div className="p-2.5 bg-zinc-100 rounded-xl w-fit text-neutral-500">
                <FileText size={22} />
              </div>
              <h4 className="text-sm font-bold text-neutral-800">Dán dữ liệu thô</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sao chép dòng dữ liệu từ file văn bản hoặc trang đào tạo và dán trực tiếp.
              </p>
            </div>
            <textarea
              placeholder="Mã môn | Tên môn | Tín chỉ..."
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                setFile(null);
              }}
              rows={2}
              className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Trang tính trong Excel (Sheet Index)
          </label>
          <input
            type="number"
            min={0}
            value={sheetIndex}
            onChange={(e) => setSheetIndex(Number(e.target.value))}
            className="border border-zinc-200 rounded-xl px-3 py-1.5 text-xs font-mono w-28 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl px-4 py-2 border border-zinc-200 bg-white hover:bg-neutral-50 text-neutral-550 text-xs font-bold transition cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="rounded-xl px-5 py-2 bg-emerald-600 hover:bg-emerald-55 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/10"
          >
            Bắt đầu phân tích
          </button>
        </div>
      </form>
    </div>
  );
}
