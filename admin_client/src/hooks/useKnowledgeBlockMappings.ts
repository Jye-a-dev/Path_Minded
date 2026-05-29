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

export function useKnowledgeBlockMappings() {
  const [data, setData] = useState<KnowledgeBlockMappingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<KnowledgeBlockMappingItem[]>("/knowledge_block_mappings");
      setData(res.data ?? []);
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

  return { data, loading, error, refresh: fetchAll, createItem, updateItem, deleteItem };
}
