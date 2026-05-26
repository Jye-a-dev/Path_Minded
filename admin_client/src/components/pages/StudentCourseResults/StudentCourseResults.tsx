import { useState } from "react";
import { usePaginatedApi } from "../../../hooks/useApi";
import { DataTable } from "../../../components/ui/DataTable";
import { Modal } from "../../../components/ui/Modal";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { StudentCourseResultForm } from "./StudentCourseResultForm";

interface ResultItem {
  id: string;
  student_id: string;
  course_code: string;
  course_name?: string;
  credits?: number;
  school_year?: string;
  semester_code?: string;
  semester_number?: number;
  score_10?: number;
  score_4?: number;
  letter_grade?: string;
  result_text?: string;
  status: "PASSED" | "FAILED" | "STUDYING";
  attempt_no?: number;
  is_latest?: boolean;
}

export default function StudentCourseResults() {
  const {
    data,
    total,
    page,
    limit,
    loading,
    error,
    search,
    setPage,
    setLimit,
    setSearch,
    createItem,
    updateItem,
    deleteItem,
  } = usePaginatedApi<ResultItem>("/student_course_results");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ResultItem | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ResultItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = async (payload: {
    student_id: string;
    course_code: string;
    course_name: string | null;
    credits: number | null;
    school_year: string | null;
    semester_code: string | null;
    semester_number: number | null;
    score_10: number | null;
    score_4: number | null;
    letter_grade: string | null;
    status: "PASSED" | "FAILED" | "STUDYING";
    attempt_no: number | null;
    is_latest: boolean;
  }) => {
    if (editingItem) {
      await updateItem(editingItem.id, payload);
    } else {
      await createItem(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this student course result?")) {
      try {
        await deleteItem(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete student result");
      }
    }
  };

  const columns = [
    {
      header: "Course",
      accessorKey: "course_code",
      render: (row: ResultItem) => (
        <div>
          <span className="font-mono text-xs font-bold text-slate-200 block">{row.course_code}</span>
          <span className="text-[10px] text-slate-500 max-w-50 truncate block">{row.course_name || "No name"}</span>
        </div>
      ),
    },
    {
      header: "Credits",
      accessorKey: "credits",
      render: (row: ResultItem) => (
        <span className="text-slate-400 font-semibold">{row.credits ?? "N/A"}</span>
      ),
    },
    {
      header: "Sem / Year",
      render: (row: ResultItem) => (
        <span className="text-slate-400 text-xs">
          {row.semester_code || "N/A"} ({row.school_year || "N/A"})
        </span>
      ),
    },
    {
      header: "Grades",
      render: (row: ResultItem) => (
        <div className="text-xs">
          <span className="text-slate-200 font-bold font-mono">
            {row.letter_grade || "N/A"}{" "}
          </span>
          <span className="text-slate-500 font-semibold font-mono">
            ({row.score_10 ?? "N/A"} / {row.score_4 ?? "N/A"})
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      render: (row: ResultItem) => {
        const colors = {
          PASSED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          STUDYING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };
        return (
          <span
            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wide ${colors[row.status]}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: "Student ID",
      accessorKey: "student_id",
      render: (row: ResultItem) => (
        <span className="text-[10px] text-slate-500 font-mono">{row.student_id}</span>
      ),
    },
    {
      header: "Actions",
      render: (row: ResultItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white m-0">Student Course Results</h1>
          <p className="mt-1 text-xs text-slate-400">
            Audit specific course marks, grades, school attempts and academic progress statuses.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 border border-rose-500/20">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable<ResultItem>
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search course code..."
        rightActions={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Create Result
          </button>
        }
      />

      {/* Modal Popup */}
      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Student Grade Result" : "Add Student Grade Result"}
        size="lg"
      >
        <StudentCourseResultForm
          key={editingItem ? editingItem.id : "create"}
          editingItem={editingItem}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
}

