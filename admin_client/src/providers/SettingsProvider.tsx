import React, { useState, useEffect } from "react";
import { SettingsContext, DEFAULT_SETTINGS } from "./SettingsContext";
import type { ThemeSettings } from "./SettingsContext";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem("admin_theme_settings");
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem("admin_theme_settings", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save settings to localStorage", e);
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem("admin_theme_settings", JSON.stringify(DEFAULT_SETTINGS));
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

    const currentAccent = accents[settings.accentColor] || accents.indigo;
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
        border: "rgba(17, 41, 43, 0.8)",
        text: "#ecfdf5",
        muted: "#6ee7b7",
        title: "#ffffff",
        btn: "#061517",
      },
      light: {
        bg: "#f8fafc",
        deep: "#ffffff",
        card: "rgba(255, 255, 255, 0.8)",
        border: "rgba(226, 232, 240, 0.8)",
        text: "#334155",
        muted: "#64748b",
        title: "#0f172a",
        btn: "#e2e8f0",
      },
    };

    const currentTheme = themes[settings.bgTheme] || themes.slate;
    root.style.setProperty("--theme-bg", currentTheme.bg);
    root.style.setProperty("--theme-bg-deep", currentTheme.deep);
    root.style.setProperty("--theme-bg-card", currentTheme.card);
    root.style.setProperty("--theme-border", currentTheme.border);
    root.style.setProperty("--theme-text", currentTheme.text);
    root.style.setProperty("--theme-text-muted", currentTheme.muted);
    root.style.setProperty("--theme-text-title", currentTheme.title);
    root.style.setProperty("--theme-bg-btn", currentTheme.btn);

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
