import { useState, useEffect, useCallback } from "react";

const isReload = () => {
  if (typeof window === "undefined") return false;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) return nav.type === "reload";
    return window.performance.navigation.type === 1;
  } catch {
    return false;
  }
};

export function useReloadPersistentState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined" && isReload()) {
      const saved = sessionStorage.getItem(key);
      if (saved !== null) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !isReload()) {
      sessionStorage.removeItem(key);
    }
  }, [key]);

  const setPersistedState = useCallback((val: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, JSON.stringify(next));
      }
      return next;
    });
  }, [key]);

  return [state, setPersistedState];
}
