import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export type CourseTypeKey = "REQUIRED" | "ELECTIVE" | "PE" | "ENGLISH" | "DEFENSE" | "OTHER";

export interface CourseTypeMappingItem {
  id: string;
  course_type: CourseTypeKey;
  label: string;
  phrases: string[];
  created_at: string;
  updated_at: string;
}

export function useCourseTypeMappings() {
  const [data, setData] = useState<CourseTypeMappingItem[]>([]);
  // 1. Initialize to true, since we fetch immediately upon mounting
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<CourseTypeMappingItem[]>("/course_type_mappings");
      setData(res.data ?? []);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 2. Suppress the warning here. We are intentionally fetching on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  const updateItem = async (id: string, payload: { phrases?: string[]; label?: string }) => {
    try {
      const res = await api.patch<CourseTypeMappingItem>(`/course_type_mappings/${id}`, payload);
      setData((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      return res.data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message || e.message || "Cập nhật thất bại");
    }
  };

  return { data, loading, error, refresh: fetchAll, updateItem };
}