"use client";

import React, { useState, useEffect } from "react";
import { SettingsContext, DEFAULT_SETTINGS } from "./SettingsContext";
import type { ThemeSettings } from "./SettingsContext";

import { useAuth } from "@/hooks/useAuth";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const getStorageKey = () => {
    if (user?.id) {
      return `user_theme_settings_${user.id}`;
    }
    return "user_theme_settings_guest";
  };

  const [settings, setSettings] = useState<ThemeSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const storageKey = user?.id ? `user_theme_settings_${user.id}` : "user_theme_settings_guest";
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  // Track the user ID to synchronize settings during render-phase
  const [prevUserId, setPrevUserId] = useState<string | undefined>(user?.id);
  if (user?.id !== prevUserId) {
    setPrevUserId(user?.id);
    const storageKey = user?.id ? `user_theme_settings_${user.id}` : "user_theme_settings_guest";
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save settings to localStorage", e);
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.error("Failed to reset settings in localStorage", e);
    }
  };

  // Synchronize CSS variables when settings change
  useEffect(() => {
    const root = document.documentElement;

    // 1. Accent colors mapping
    const accents = {
      indigo: {
        color: "#4f46e5",
        hover: "#4338ca",
        light: "#818cf8",
        rgb: "79, 70, 229",
      },
      teal: {
        color: "#0d9488",
        hover: "#0f766e",
        light: "#2dd4bf",
        rgb: "13, 148, 136",
      },
      violet: {
        color: "#7c3aed",
        hover: "#6d28d9",
        light: "#a78bfa",
        rgb: "124, 58, 237",
      },
      emerald: {
        color: "#059669",
        hover: "#047857",
        light: "#34d399",
        rgb: "5, 150, 105",
      },
      rose: {
        color: "#e11d48",
        hover: "#be123c",
        light: "#fb7185",
        rgb: "225, 29, 72",
      },
      amber: {
        color: "#d97706",
        hover: "#b45309",
        light: "#fbbf24",
        rgb: "217, 119, 6",
      },
    };

    const currentAccent = accents[settings.accentColor] || accents.emerald;
    root.style.setProperty("--primary-color", currentAccent.color);
    root.style.setProperty("--primary-hover", currentAccent.hover);
    root.style.setProperty("--primary-light", currentAccent.light);
    root.style.setProperty("--primary-rgb", currentAccent.rgb);

    // 2. Background themes mapping
    const themes = {
      slate: {
        bg: "#0f172a",
        deep: "#020617",
        card: "rgba(15, 23, 42, 0.6)",
        mid: "rgba(30, 41, 59, 0.45)",
        border: "rgba(30, 41, 59, 0.8)",
        text: "#f1f5f9",
        muted: "#94a3b8",
        title: "#ffffff",
        btn: "#1e293b",
      },
      zinc: {
        bg: "#09090b",
        deep: "#000000",
        card: "rgba(20, 20, 25, 0.6)",
        mid: "rgba(39, 39, 42, 0.45)",
        border: "rgba(39, 39, 42, 0.8)",
        text: "#f4f4f5",
        muted: "#a1a1aa",
        title: "#ffffff",
        btn: "#18181b",
      },
      navy: {
        bg: "#0B0F19",
        deep: "#070A13",
        card: "rgba(13, 20, 36, 0.6)",
        mid: "rgba(21, 28, 44, 0.45)",
        border: "rgba(30, 41, 59, 0.8)",
        text: "#f1f5f9",
        muted: "#94a3b8",
        title: "#ffffff",
        btn: "#0D1424",
      },
      emerald: {
        bg: "#040D0E",
        deep: "#020708",
        card: "rgba(6, 21, 23, 0.6)",
        mid: "rgba(9, 31, 33, 0.45)",
        border: "rgba(17, 41, 43, 0.8)",
        text: "#ecfdf5",
        muted: "#6ee7b7",
        title: "#ffffff",
        btn: "#061517",
      },
      light: {
        bg: "#f6f4ef",
        deep: "#eae6df",
        card: "rgba(255, 255, 255, 0.8)",
        mid: "#f1f5f9",
        border: "rgba(226, 232, 240, 0.8)",
        text: "#334155",
        muted: "#64748b",
        title: "#0f172a",
        btn: "#e2e8f0",
      },
    };

    const currentTheme = themes[settings.bgTheme] || themes.light;
    root.style.setProperty("--theme-bg", currentTheme.bg);
    root.style.setProperty("--theme-bg-deep", currentTheme.deep);
    root.style.setProperty("--theme-bg-card", currentTheme.card);
    root.style.setProperty("--theme-bg-mid", currentTheme.mid);
    root.style.setProperty("--theme-border", currentTheme.border);
    root.style.setProperty("--theme-text", currentTheme.text);
    root.style.setProperty("--theme-text-muted", currentTheme.muted);
    root.style.setProperty("--theme-text-title", currentTheme.title);
    root.style.setProperty("--theme-bg-btn", currentTheme.btn);

    // Add or remove dark mode class
    if (settings.bgTheme !== "light") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // 3. Compact tables modifier class
    if (settings.compactTables) {
      root.classList.add("compact-tables");
    } else {
      root.classList.remove("compact-tables");
    }

    // 4. Glassmorphism modifier class
    if (settings.glassmorphism) {
      root.classList.add("glass-ui");
    } else {
      root.classList.remove("glass-ui");
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
