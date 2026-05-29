import { useState } from "react";
import { SelectionScreen } from "./SelectionScreen";
import { CurriculumCoursesManager } from "./CurriculumCoursesManager";

// ─── Entry Component Export ──────────────────────────────────────
export default function CurriculumCourses() {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(() => {
    return sessionStorage.getItem("selected_curriculum_program_id");
  });

  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
    sessionStorage.setItem("selected_curriculum_program_id", id);
  };

  const handleClearProgram = () => {
    setSelectedProgramId(null);
    sessionStorage.removeItem("selected_curriculum_program_id");
  };

  if (!selectedProgramId) {
    return <SelectionScreen onSelect={handleSelectProgram} />;
  }

  return (
    <CurriculumCoursesManager
      selectedProgramId={selectedProgramId}
      onBack={handleClearProgram}
    />
  );
}
