import React from "react";
import { Save, X } from "lucide-react";

interface CoursePreviewItem {
  courseCode: string;
  courseName: string;
  credits: number | null;
  theoryHours: number | null;
  practiceHours: number | null;
  projectHours: number | null;
  internshipHours: number | null;
  expectedSemester: number | null;
  courseGroup: string | null;
  courseType: string;
  prerequisite: string | null;
  corequisite: string | null;
  organizingSemester: string | null;
  knowledgeBlock?: string | null;
}

interface PreviewTableRowEditProps {
  idx: number;
  editForm: CoursePreviewItem;
  onEditFormChange: (form: CoursePreviewItem) => void;
  onSaveEdit: (index: number) => void;
  onCancelEdit: () => void;
  knowledgeBlocks: Array<{ knowledge_block: string; label: string }>;
}

export const PreviewTableRowEdit: React.FC<PreviewTableRowEditProps> = ({
  idx,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
  knowledgeBlocks,
}) => {
  return (
    <>
      <td className="px-2 py-1">
        <input
          type="text"
          value={editForm.courseCode}
          onChange={(e) =>
            onEditFormChange({ ...editForm, courseCode: e.target.value.toUpperCase() })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={editForm.courseName}
          onChange={(e) => onEditFormChange({ ...editForm, courseName: e.target.value })}
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-white focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-14">
        <input
          type="number"
          value={editForm.credits ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              credits: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-12">
        <input
          type="number"
          value={editForm.theoryHours ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              theoryHours: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-12">
        <input
          type="number"
          value={editForm.practiceHours ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              practiceHours: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-12">
        <input
          type="number"
          value={editForm.projectHours ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              projectHours: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-12">
        <input
          type="number"
          value={editForm.internshipHours ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              internshipHours: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1">
        <select
          value={editForm.courseType}
          onChange={(e) => onEditFormChange({ ...editForm, courseType: e.target.value })}
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-slate-300 focus:outline-none"
        >
          <option value="REQUIRED">REQUIRED</option>
          <option value="ELECTIVE">ELECTIVE</option>
          <option value="PE">PE</option>
          <option value="ENGLISH">ENGLISH</option>
          <option value="DEFENSE">DEFENSE</option>
          <option value="OTHER">OTHER</option>
        </select>
      </td>
      <td className="px-2 py-1">
        <select
          value={editForm.knowledgeBlock || "GENERAL"}
          onChange={(e) =>
            onEditFormChange({ ...editForm, knowledgeBlock: e.target.value })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-slate-300 focus:outline-none"
        >
          {knowledgeBlocks.map((kb) => (
            <option key={kb.knowledge_block} value={kb.knowledge_block}>
              {kb.label} ({kb.knowledge_block})
            </option>
          ))}
          {knowledgeBlocks.length === 0 && (
            <>
              <option value="GENERAL">Đại cương (GENERAL)</option>
              <option value="SECTOR_CORE">Cơ sở khối ngành (SECTOR_CORE)</option>
              <option value="MAJOR_CORE">Cơ sở ngành (MAJOR_CORE)</option>
              <option value="SPECIALIZED">Chuyên ngành (SPECIALIZED)</option>
            </>
          )}
        </select>
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={editForm.prerequisite ?? ""}
          onChange={(e) =>
            onEditFormChange({ ...editForm, prerequisite: e.target.value || null })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="text"
          value={editForm.corequisite ?? ""}
          onChange={(e) =>
            onEditFormChange({ ...editForm, corequisite: e.target.value || null })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1.5 py-1 text-xs text-slate-300 focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-20">
        <input
          type="text"
          value={editForm.organizingSemester ?? ""}
          onChange={(e) =>
            onEditFormChange({ ...editForm, organizingSemester: e.target.value || null })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-14">
        <input
          type="number"
          value={editForm.expectedSemester ?? ""}
          onChange={(e) =>
            onEditFormChange({
              ...editForm,
              expectedSemester: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-full rounded border border-indigo-500 bg-slate-955 px-1 py-1 text-xs text-center focus:outline-none"
        />
      </td>
      <td className="px-2 py-1 w-12 text-center text-slate-400 font-semibold">
        {editForm.expectedSemester ? Math.ceil(editForm.expectedSemester / 3) : "-"}
      </td>
      <td className="px-4 py-2 text-center flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => onSaveEdit(idx)}
          className="p-1 rounded text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
          title="Lưu"
        >
          <Save size={13} />
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="p-1 rounded text-rose-400 hover:bg-slate-800 transition cursor-pointer"
          title="Hủy"
        >
          <X size={13} />
        </button>
      </td>
    </>
  );
};
