import { useSearchParams } from "react-router-dom";
import { SelectionScreen } from "../../../components/ui/SelectionScreen";
import { CurriculumCoursesManager } from "./CurriculumCoursesManager";

// ─── Entry Component Export ──────────────────────────────────────
export default function CurriculumCourses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedProgramId = searchParams.get("programId") || null;

  const handleSelectProgram = (id: string) => {
    setSearchParams({ programId: id });
  };

  const handleClearProgram = () => {
    setSearchParams({});
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
