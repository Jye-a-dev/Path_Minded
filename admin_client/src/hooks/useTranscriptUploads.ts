import { usePaginatedApi } from "./useApi";
import { api } from "../services/api";

export interface ParsedJson {
  results?: Array<{
    courseCode: string;
    courseName?: string;
    credits?: number;
    schoolYear?: string;
    semesterNumber?: number;
    score10?: number;
    score4?: number;
    letterGrade?: string;
    status: "PASSED" | "FAILED" | "STUDYING";
  }>;
  [key: string]: unknown;
}

export interface UploadItem {
  id: string;
  student_id: string;
  student_code?: string;
  full_name?: string;
  source_type: "PASTE" | "FILE";
  parse_status: "PENDING" | "SUCCESS" | "FAILED";
  parse_error?: string;
  uploaded_at: string;
  parsed_at?: string;
  parsed_json?: ParsedJson;
  raw_text?: string;
}

export function useTranscriptUploads() {
  const paginated = usePaginatedApi<UploadItem>("/transcript_uploads");

  const createUpload = async (payload: { student_id: string; textContent: string }) => {
    const fullPayload = {
      sourceType: "text",
      ...payload,
    };
    const response = await api.post("/transcript_uploads", fullPayload);
    await paginated.refresh();
    return response.data;
  };

  return {
    ...paginated,
    createUpload,
  };
}
