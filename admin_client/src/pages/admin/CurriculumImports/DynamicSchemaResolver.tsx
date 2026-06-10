import React, { useState, useEffect, useMemo } from "react";
import { api } from "../../../services/api";
import { AlertCircle, ArrowRight, RefreshCw, LayoutGrid, Sparkles } from "lucide-react";

interface DynamicSchemaResolverProps {
  importSessionId: string;
  rawHeaders: string[];
  sheets: string[];
  activeSheetIndex: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface MappingConfigItem {
  id: string;
  field_key: string;
  display_label: string;
  phrases: string[];
}

export const DynamicSchemaResolver: React.FC<DynamicSchemaResolverProps> = ({
  rawHeaders: rawHeadersList,
  sheets,
  activeSheetIndex,
  onSuccess,
  onCancel,
}) => {
  const [columnMappings, setColumnMappings] = useState<MappingConfigItem[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean raw headers to remove empty items with useMemo to avoid dependency loop references
  const rawHeaders = useMemo(() => {
    return rawHeadersList.map(h => h.trim()).filter(Boolean);
  }, [rawHeadersList]);

  useEffect(() => {
    const fetchMappings = async () => {
      setLoading(true);
      try {
        const res = await api.get("/curriculum_column_mappings?limit=100");
        const list: MappingConfigItem[] = res.data?.data || res.data || [];
        setColumnMappings(list.filter(m => m.field_key));

        // Try to auto-suggest mappings based on basic substring matches
        const suggestions: Record<string, string> = {};
        list.forEach((dbField) => {
          // Look for an excel column that is in the existing phrases
          const matchedHeader = rawHeaders.find((header) => {
            const lowerHeader = header.toLowerCase().trim();
            return (
              dbField.phrases.some(p => lowerHeader.includes(p.toLowerCase())) ||
              dbField.display_label.toLowerCase().includes(lowerHeader) ||
              lowerHeader.includes(dbField.display_label.toLowerCase())
            );
          });
          if (matchedHeader) {
            suggestions[dbField.field_key] = matchedHeader;
          }
        });
        setSelectedMapping(suggestions);
      } catch (err) {
        console.error("Failed to fetch column mappings config", err);
        setError("Không thể tải cấu hình ánh xạ cột từ hệ thống.");
      } finally {
        setLoading(false);
      }
    };
    fetchMappings();
  }, [rawHeaders]);

  const handleSelectHeader = (fieldKey: string, excelHeader: string) => {
    setSelectedMapping((prev) => ({
      ...prev,
      [fieldKey]: excelHeader,
    }));
  };

  const handleSaveAndReparse = async () => {
    const keysMapped = Object.keys(selectedMapping).filter(k => selectedMapping[k]);
    if (keysMapped.length < 2) {
      setError("Vui lòng ánh xạ ít nhất 2 trường cốt lõi (Mã môn học và Tên môn học) để tiếp tục.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Update the database mappings with the new mapping phrase
      for (const fieldKey of keysMapped) {
        const dbField = columnMappings.find(m => m.field_key === fieldKey);
        const mappedExcelHeader = selectedMapping[fieldKey];
        if (!dbField || !mappedExcelHeader) continue;

        const phraseClean = mappedExcelHeader.trim().toLowerCase();
        if (!dbField.phrases.includes(phraseClean)) {
          // Append the new phrase to the database config
          await api.patch(`/curriculum_column_mappings/${dbField.id}`, {
            phrases: [...dbField.phrases, phraseClean],
          });
        }
      }

      // 2. Map success! Trigger on success callback (which will reparse the import session)
      onSuccess();
    } catch (err) {
      console.error("Failed to update schema mappings:", err);
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Lưu ánh xạ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const dbFields = [
    { key: "course_code", label: "Mã môn học (Course Code)", required: true, desc: "Ví dụ: INT1008, CS101..." },
    { key: "course_name", label: "Tên môn học (Course Name)", required: true, desc: "Ví dụ: Cơ sở dữ liệu, Toán rời rạc..." },
    { key: "credits", label: "Số tín chỉ (Credits)", required: false, desc: "Số tín chỉ tích lũy" },
    { key: "expected_semester", label: "Học kỳ đề xuất (Semester)", required: false, desc: "Học kỳ khuyến nghị: 1, 2, 3..." },
    { key: "theory_hours", label: "Giờ lý thuyết", required: false, desc: "Số tiết lý thuyết" },
    { key: "practice_hours", label: "Giờ thực hành", required: false, desc: "Số tiết thực hành" },
    { key: "knowledge_block", label: "Khối kiến thức", required: false, desc: "Ví dụ: Đại cương, Chuyên ngành" },
    { key: "course_type", label: "Loại môn học", required: false, desc: "Ví dụ: Bắt buộc, Tự chọn" },
    { key: "prerequisite", label: "Học phần tiên quyết", required: false, desc: "Mã các môn học bắt buộc học trước" },
    { key: "corequisite", label: "Học phần song hành", required: false, desc: "Các môn học song hành" },
  ];

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-bold text-amber-200 block">Cấu trúc file Excel chưa tương thích</span>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Hệ thống không tìm thấy tiêu đề cột tiêu chuẩn (như *Mã học phần*, *Tên học phần*). Vui lòng chọn ánh xạ các tiêu đề cột thô tìm thấy dưới đây vào các trường dữ liệu tương ứng của Database.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-3 text-xs font-bold text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12 gap-2 text-slate-500 text-xs">
          <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
          Đang tải cấu hình lược đồ...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid size={14} style={{ color: "var(--primary-color)" }} />
              Bản đồ khớp cột (Excel &rarr; CSDL)
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Trang tính: {sheets[activeSheetIndex]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbFields.map((field) => {
              const currentValue = selectedMapping[field.key] || "";
              return (
                <div
                  key={field.key}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between gap-3 hover:border-slate-700/80 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        {field.label}
                        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{field.desc}</span>
                  </div>

                  <select
                    value={currentValue}
                    onChange={(e) => handleSelectHeader(field.key, e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-700"
                  >
                    <option className="bg-slate-900 text-slate-500" value="">-- Chọn cột trong Excel --</option>
                    {rawHeaders.map((header) => (
                      <option className="bg-slate-900 text-slate-200" key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400 animate-pulse" />
              Cơ chế học máy lược đồ (Schema learning)
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Sau khi bạn xác nhận khớp, hệ thống sẽ tự học các tiêu đề cột thô này. Những file nhập có cấu trúc tương tự ở các ngành khác từ lần sau sẽ được tự động nhận diện mà không cần thiết lập lại.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          Hủy phiên
        </button>
        <button
          type="button"
          disabled={saving || loading}
          onClick={handleSaveAndReparse}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-550 px-5 py-2 text-xs font-bold text-white shadow-lg transition disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: "var(--primary-color)" }}
        >
          {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
          Lưu cấu hình & Phân tích lại
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};