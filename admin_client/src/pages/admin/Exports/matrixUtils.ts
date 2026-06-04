import React from "react";
import type { MatrixPreviewData } from "./types";

// Cell value logic (matches DB comment: PASSED→score/x, FAILED→score/o, STUDYING→sem_no)
export function getCellValue(
  result: MatrixPreviewData["results"][0] | undefined
): string {
  if (!result) return "";
  if (result.status === "PASSED") return result.score_10?.toString() ?? "x";
  if (result.status === "FAILED") return result.score_10?.toString() ?? "o";
  if (result.status === "STUDYING") {
    if (result.semester_code) {
      return result.semester_code;
    }
    return result.semester_number?.toString() ?? "y";
  }
  return "";
}

export function getCellStyle(result: MatrixPreviewData["results"][0] | undefined): React.CSSProperties {
  if (!result) return {};
  if (result.status === "PASSED") return { backgroundColor: "#e8f5e9", color: "#2e7d32", fontWeight: "bold" };
  if (result.status === "FAILED") return { backgroundColor: "#ffebee", color: "#c62828", fontWeight: "bold" };
  if (result.status === "STUDYING") return { backgroundColor: "#fffde7", color: "#ef6c00", fontWeight: "bold" };
  return {};
}

// Knowledge block grouping helpers
export const KB_LABELS: Record<string, string> = {
  GENERAL: "Kiến thức giáo dục đại cương",
  SECTOR_CORE: "Kiến thức cơ sở khối ngành",
  MAJOR_CORE: "Kiến thức cơ sở ngành",
  SPECIALIZED: "Kiến thức chuyên ngành",
};

export const KB_COLORS: Record<string, string> = {
  GENERAL:     "#d4edda",
  SECTOR_CORE: "#cce5ff",
  MAJOR_CORE:  "#fff3cd",
  SPECIALIZED: "#f8d7da",
};
