"use client";

import { createContext, useContext } from "react";

export interface ThemeSettings {
  bgTheme: "slate" | "zinc" | "navy" | "emerald" | "light";
  accentColor: "indigo" | "teal" | "violet" | "emerald" | "rose" | "amber";
  compactTables: boolean;
  glassmorphism: boolean;
  showNavbar: boolean;
  meshGradient: boolean;
}

export interface SettingsContextType {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  resetSettings: () => void;
}

export const DEFAULT_SETTINGS: ThemeSettings = {
  bgTheme: "light", // Default to light for user portal to be consistent with the initial design
  accentColor: "emerald", // Default to emerald for advisor, can be overridden by layout
  compactTables: false,
  glassmorphism: true,
  showNavbar: true,
  meshGradient: true,
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
