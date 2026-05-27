import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";

interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function usePaginatedApi<T>(endpoint: string, initialFilters: Record<string, unknown> = {}) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);
  const [search, setSearch] = useState("");

  // Debounced search - 300ms delay to avoid spamming API on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const prevFiltersRef = useRef<Record<string, unknown>>(initialFilters);
  const prevDebouncedSearchRef = useRef("");

  // Debounce: update debouncedSearch 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = { ...filters };
      if (debouncedSearch.trim()) {
        activeFilters.search = debouncedSearch;
      }

      const response = await api.get<PaginatedResponse<T>>(`${endpoint}/pagination`, {
        params: {
          page: currentPage,
          limit,
          ...activeFilters,
        },
      });

      if (response.data) {
        setData(response.data.data ?? []);
        const totalCount = response.data.pagination?.total ?? response.data.total ?? 0;
        setTotal(totalCount);
      }
    } catch (err) {
      console.error(`Error fetching paginated data for ${endpoint}:`, err);
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errObj.response?.data?.message || errObj.message || "Failed to load data");
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [endpoint, limit, filters, debouncedSearch]);

  // Single unified effect: reset page when filters/search change, then fetch
  useEffect(() => {
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(prevFiltersRef.current);
    const searchChanged = debouncedSearch !== prevDebouncedSearchRef.current;

    let targetPage = page;
    if (filtersChanged || searchChanged) {
      targetPage = 1;
      setPage(1);
      prevFiltersRef.current = filters;
      prevDebouncedSearchRef.current = debouncedSearch;
    }

    void fetchData(targetPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filters, debouncedSearch]);

  const updateFilters = useCallback((newFilters: Record<string, unknown>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearch("");
  }, [initialFilters]);

  const refresh = useCallback(() => {
    return fetchData(page);
  }, [fetchData, page]);

  // CRUD operation wrappers that automatically refresh data
  const createItem = async (payload: unknown) => {
    setError(null);
    try {
      const response = await api.post(endpoint, payload);
      await fetchData(page);
      return response.data;
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errObj.response?.data?.message || errObj.message || "Failed to create item";
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const updateItem = async (id: string | number, payload: unknown) => {
    setError(null);
    try {
      const response = await api.patch(`${endpoint}/${id}`, payload);
      await fetchData(page);
      return response.data;
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errObj.response?.data?.message || errObj.message || "Failed to update item";
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const deleteItem = async (id: string | number) => {
    setError(null);
    try {
      const response = await api.delete(`${endpoint}/${id}`);
      await fetchData(page);
      return response.data;
    } catch (err) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = errObj.response?.data?.message || errObj.message || "Failed to delete item";
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  return {
    data,
    total,
    page,
    limit,
    loading,
    error,
    filters,
    search,
    setPage,
    setLimit,
    setSearch,
    updateFilters,
    clearFilters,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };
}
