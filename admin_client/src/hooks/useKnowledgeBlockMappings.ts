import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

export interface KnowledgeBlockMappingItem {
  id: string;
  knowledge_block: string;
  label: string;
  phrases: string[];
  created_at: string;
  updated_at: string;
}

export interface KBStatItem {
  knowledge_block: string;
  program_id: string;
  program_code: string;
  program_name: string;
  course_count: number;
}

export function useKnowledgeBlockMappings() {
  const [data, setData] = useState<KnowledgeBlockMappingItem[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, KBStatItem[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mappingsRes, statsRes] = await Promise.all([
        api.get<KnowledgeBlockMappingItem[]>("/knowledge_block_mappings"),
        api.get<KBStatItem[]>("/knowledge_block_mappings/stats"),
      ]);
      setData(mappingsRes.data ?? []);

      const map = new Map<string, KBStatItem[]>();
      for (const stat of statsRes.data ?? []) {
        const existing = map.get(stat.knowledge_block) ?? [];
        map.set(stat.knowledge_block, [...existing, stat]);
      }
      setStatsMap(map);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
  }, [fetchAll]);

  const createItem = async (payload: { knowledge_block: string; label: string; phrases: string[] }) => {
    try {
      const res = await api.post<KnowledgeBlockMappingItem>("/knowledge_block_mappings", payload);
      setData((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message || e.message || "Thêm thất bại");
    }
  };

  const updateItem = async (id: string, payload: { phrases?: string[]; label?: string }) => {
    try {
      const res = await api.patch<KnowledgeBlockMappingItem>(`/knowledge_block_mappings/${id}`, payload);
      setData((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      return res.data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message || e.message || "Cập nhật thất bại");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/knowledge_block_mappings/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(e.response?.data?.message || e.message || "Xóa thất bại");
    }
  };

  return { data, statsMap, loading, error, refresh: fetchAll, createItem, updateItem, deleteItem };
}
