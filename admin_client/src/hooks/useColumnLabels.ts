import { useState, useEffect } from "react";
import { api } from "../services/api";

interface ColumnMapping {
  id: string;
  field_key: string;
  display_label: string;
  mapping_type: "CURRICULUM" | "CLASS";
}

// Module-level cache: avoids re-fetching on every component mount
let cachedMappings: ColumnMapping[] | null = null;
let fetchPromise: Promise<ColumnMapping[]> | null = null;

async function fetchMappings(): Promise<ColumnMapping[]> {
  if (cachedMappings) return cachedMappings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = api
    .get<ColumnMapping[]>("/curriculum_column_mappings?limit=200")
    .then((res) => {
      const rows: ColumnMapping[] = Array.isArray(res.data)
        ? res.data
        : ((res.data as { data?: ColumnMapping[] }).data ?? []);
      cachedMappings = rows;
      fetchPromise = null;
      return rows;
    })
    .catch(() => {
      fetchPromise = null;
      return [];
    });

  return fetchPromise;
}

/** Invalidate cache (e.g. after editing mappings on the ColumnMappings page) */
export function invalidateColumnLabelsCache() {
  cachedMappings = null;
  fetchPromise = null;
}

export type GetLabelFn = (fieldKey: string, fallback?: string) => string;

/**
 * Hook that returns a stable `getLabel(fieldKey, fallback?)` function.
 * Labels are sourced from the curriculum_column_mappings API.
 *
 * @param mappingType  Optional filter: "CURRICULUM" | "CLASS" | undefined (all)
 */
export function useColumnLabels(mappingType?: "CURRICULUM" | "CLASS") {
  const [mappings, setMappings] = useState<ColumnMapping[]>(cachedMappings ?? []);

  useEffect(() => {
    let cancelled = false;
    fetchMappings().then((rows) => {
      if (!cancelled) setMappings(rows);
    });
    return () => { cancelled = true; };
  }, []);

  const getLabel: GetLabelFn = (fieldKey: string, fallback?: string) => {
    const filtered = mappingType
      ? mappings.filter((m) => m.mapping_type === mappingType)
      : mappings;
    const found = filtered.find((m) => m.field_key === fieldKey);
    return found?.display_label ?? fallback ?? fieldKey;
  };

  return { getLabel, mappings };
}
