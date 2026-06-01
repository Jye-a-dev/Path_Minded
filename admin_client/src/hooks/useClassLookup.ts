  import { useState, useEffect } from "react";
import { api } from "../services/api";

interface ClassCacheItem {
  id: string;
  class_code: string;
  class_name?: string;
}

// Module-level singleton cache
let cachedClasses: ClassCacheItem[] | null = null;
let fetchPromise: Promise<ClassCacheItem[]> | null = null;

async function fetchClasses(): Promise<ClassCacheItem[]> {
  if (cachedClasses) return cachedClasses;
  if (fetchPromise) return fetchPromise;

  fetchPromise = api
    .get<ClassCacheItem[]>("/classes?limit=500")
    .then((res) => {
      const rows: ClassCacheItem[] = Array.isArray(res.data)
        ? res.data
        : ((res.data as { data?: ClassCacheItem[] }).data ?? []);
      cachedClasses = rows;
      fetchPromise = null;
      return rows;
    })
    .catch(() => {
      fetchPromise = null;
      return [];
    });

  return fetchPromise;
}

export function invalidateClassesCache() {
  cachedClasses = null;
  fetchPromise = null;
}

/**
 * Hook that returns a stable `getClassName(classId)` function.
 * Returns class_code (and optionally class_name) for a given class UUID.
 */
export function useClassLookup() {
  const [classes, setClasses] = useState<ClassCacheItem[]>(cachedClasses ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchClasses().then((rows) => {
      if (!cancelled) setClasses(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const getClassName = (classId?: string | null): string => {
    if (!classId) return "Chưa phân lớp";
    const found = classes.find((c) => c.id === classId);
    if (!found) return classId; // fallback to raw id while loading
    return found.class_name
      ? `${found.class_code} – ${found.class_name}`
      : found.class_code;
  };

  return { getClassName, classes };
}
