"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
} from "lucide-react";

import {
  UploadHistoryTable,
  UploadSession,
} from "./components/UploadHistoryTable";
import { TranscriptUploadModal } from "./components/TranscriptUploadModal";
import { TranscriptDeleteModal } from "./components/TranscriptDeleteModal";
import { TranscriptDetailModal } from "./components/TranscriptDetailModal";

interface StudentProfile {
  id: string;
  student_code: string;
  full_name: string;
  status: "ACTIVE" | "GRADUATED" | "DROPPED";
  has_grades?: boolean;
}

export default function StudentTranscriptsPage() {
  const { user } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [uploads, setUploads] = useState<UploadSession[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);

  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadSession | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // ── Fetch upload history (reused by submit / delete handlers) ─
  const fetchUploads = useCallback(async (profile: StudentProfile) => {
    setLoadingUploads(true);
    try {
      const res = await api.get(`/transcript_uploads?student_id=${profile.id}&limit=100`);
      setUploads(res.data || []);
    } catch (err) {
      console.error("Failed to fetch uploads:", err);
    } finally {
      setLoadingUploads(false);
    }
  }, []);

  // ── Fetch student profile + uploads in one effect ────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingStudent(true);
      try {
        const res = await api.get(`/students?user_id=${user.id}`);
        if (res.data?.length > 0) {
          const profile: StudentProfile = res.data[0];
          setStudentProfile(profile);
          await fetchUploads(profile);
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
      } finally {
        setLoadingStudent(false);
      }
    };
    void load();
  }, [user, fetchUploads]);

  // ── Loading / no profile states ──────────────────────────────
  if (loadingStudent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-neutral-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!studentProfile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500">
          <AlertCircle size={30} />
        </div>
        <h1 className="text-xl font-bold text-neutral-900">Chưa liên kết hồ sơ</h1>
        <p className="text-sm text-neutral-500">
          Tài khoản ({user?.email}) chưa được liên kết với hồ sơ sinh viên.
          Vui lòng liên hệ CVHT để được hỗ trợ.
        </p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200 text-violet-700 text-xs font-bold mb-2">
            <FileSpreadsheet size={12} />
            <span>Bảng điểm & Transcript</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Quản lý Bảng điểm
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Tải lên tệp Excel hoặc dán văn bản từ cổng đào tạo. Hệ thống tự động bóc tách và phân tích các học phần.
          </p>
        </div>
        <button
          onClick={() => {
            setUploadFormOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Nhập bảng điểm mới
        </button>
      </div>

      {/* Upload history */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <UploadHistoryTable
          uploads={uploads}
          loadingUploads={loadingUploads}
          onSelectUpload={setSelectedUpload}
          onDeleteSession={setDeleteSessionId}
        />
      </div>

      {/* Modals */}
      <TranscriptUploadModal
        isOpen={uploadFormOpen}
        onClose={() => setUploadFormOpen(false)}
        studentId={studentProfile.id}
        onSuccess={async () => {
          await fetchUploads(studentProfile);
          const studentRes = await api.get(`/students/${studentProfile.id}`);
          if (studentRes.data) setStudentProfile(studentRes.data);
        }}
      />

      <TranscriptDeleteModal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        sessionId={deleteSessionId}
        onSuccess={async () => {
          await fetchUploads(studentProfile);
          const studentRes = await api.get(`/students/${studentProfile.id}`);
          if (studentRes.data) setStudentProfile(studentRes.data);
        }}
      />

      <TranscriptDetailModal
        upload={selectedUpload}
        onClose={() => setSelectedUpload(null)}
      />
    </div>
  );
}
