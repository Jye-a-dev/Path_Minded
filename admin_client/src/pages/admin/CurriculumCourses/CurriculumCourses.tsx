import { useReloadPersistentState } from "../../../hooks/useReloadPersistentState";
import { SelectionScreen } from "./SelectionScreen";
import { CurriculumCoursesManager } from "./CurriculumCoursesManager";

// ─── Entry Component Export ──────────────────────────────────────
export default function CurriculumCourses() {
  const [selectedProgramId, setSelectedProgramId] = useReloadPersistentState<string | null>(
    "selected_curriculum_program_id",
    null
  );

  const handleSelectProgram = (id: string) => {
    setSelectedProgramId(id);
  };

  const handleClearProgram = () => {
    setSelectedProgramId(null);
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
