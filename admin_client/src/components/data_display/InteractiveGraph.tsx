import React, { useState, useEffect, useMemo, useRef } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";
import type { CourseItem } from "../../hooks/useCurriculumCourses";
import type { PrerequisiteItem } from "../../hooks/useCoursePrerequisites";
import { GraphCanvas } from "./components/GraphCanvas";
import { CourseInfoPanel } from "./components/CourseInfoPanel";

interface InteractiveGraphProps {
  programId: string;
}

export const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ programId }) => {
  const [curriculum, setCurriculum] = useState<CourseItem[]>([]);
  const [prereqs, setPrereqs] = useState<PrerequisiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation Zoom and Pan
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Selection state
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  // Load curriculum and prerequisites
  useEffect(() => {
    if (!programId) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [curriculumRes, prereqRes] = await Promise.all([
          api.get(`/curriculum_courses?program_id=${programId}&limit=500`),
          api.get(`/course_prerequisites?program_id=${programId}&limit=500`),
        ]);

        const curriculumList: CourseItem[] = curriculumRes.data?.data ?? curriculumRes.data ?? [];
        const prereqList: PrerequisiteItem[] = prereqRes.data?.data ?? prereqRes.data ?? [];

        setCurriculum(curriculumList);
        setPrereqs(prereqList);
      } catch (err) {
        console.error("Error loading interactive graph data:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu đồ thị học phần.");
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [programId]);

  // Compute layout positions for each course
  const layout = useMemo(() => {
    const semesters: Record<number, CourseItem[]> = {};
    const maxSem = 8;
    for (let i = 1; i <= maxSem; i++) {
      semesters[i] = [];
    }

    curriculum.forEach((c) => {
      const sem = c.expected_semester || 99;
      const targetSem = sem <= maxSem ? sem : maxSem;
      if (!semesters[targetSem]) semesters[targetSem] = [];
      semesters[targetSem].push(c);
    });

    const positions: Record<string, { x: number; y: number }> = {};
    const colWidth = 260;
    const rowHeight = 110;
    const paddingLeft = 50;
    const paddingTop = 60;

    let maxRows = 0;
    Object.values(semesters).forEach((list) => {
      if (list.length > maxRows) maxRows = list.length;
    });

    Object.keys(semesters).forEach((semKey) => {
      const semNum = parseInt(semKey, 10);
      const list = semesters[semNum];
      const colX = paddingLeft + (semNum - 1) * colWidth;

      const totalColHeight = list.length * rowHeight;
      const maxColHeight = maxRows * rowHeight;
      const startY = paddingTop + (maxColHeight - totalColHeight) / 2;

      list.forEach((c, index) => {
        positions[c.course_code] = {
          x: colX,
          y: startY + index * rowHeight,
        };
      });
    });

    return positions;
  }, [curriculum]);

  // Find all ancestors and descendants for highlight
  const dependencyPaths = useMemo(() => {
    if (!selectedCourseCode) return { ancestors: new Set<string>(), descendants: new Set<string>() };

    const ancestors = new Set<string>();
    const descendants = new Set<string>();

    const queuePrereq = [selectedCourseCode];
    while (queuePrereq.length > 0) {
      const current = queuePrereq.shift()!;
      const matchingPrereqs = prereqs.filter((r) => r.course_code === current);
      matchingPrereqs.forEach((r) => {
        if (!ancestors.has(r.prerequisite_course_code)) {
          ancestors.add(r.prerequisite_course_code);
          queuePrereq.push(r.prerequisite_course_code);
        }
      });
    }

    const queueDep = [selectedCourseCode];
    while (queueDep.length > 0) {
      const current = queueDep.shift()!;
      const matchingDeps = prereqs.filter((r) => r.prerequisite_course_code === current);
      matchingDeps.forEach((r) => {
        if (!descendants.has(r.course_code)) {
          descendants.add(r.course_code);
          queueDep.push(r.course_code);
        }
      });
    }

    return { ancestors, descendants };
  }, [selectedCourseCode, prereqs]);

  // Mouse handlers for dragging/panning the canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 1.5));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.4));
  const resetZoom = () => {
    setZoom(0.75);
    setPan({ x: 40, y: 30 });
    setSelectedCourseCode(null);
  };

  // Selection Detail Card info
  const selectedCourseDetails = useMemo(() => {
    if (!selectedCourseCode) return null;
    const course = curriculum.find((c) => c.course_code === selectedCourseCode);
    if (!course) return null;

    const directPrereqs = prereqs
      .filter((r) => r.course_code === selectedCourseCode)
      .map((r) => {
        const found = curriculum.find((c) => c.course_code === r.prerequisite_course_code);
        return {
          code: r.prerequisite_course_code,
          name: found ? found.course_name : "Môn học chưa rõ",
          type: r.prerequisite_type,
        };
      });

    const directDependents = prereqs
      .filter((r) => r.prerequisite_course_code === selectedCourseCode)
      .map((r) => {
        const found = curriculum.find((c) => c.course_code === r.course_code);
        return {
          code: r.course_code,
          name: found ? found.course_name : "Môn học chưa rõ",
          type: r.prerequisite_type,
        };
      });

    const outDegree = prereqs.filter((r) => r.prerequisite_course_code === selectedCourseCode).length;

    return {
      ...course,
      prerequisites: directPrereqs,
      dependents: directDependents,
      outDegree,
    };
  }, [selectedCourseCode, curriculum, prereqs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3 text-slate-400 bg-slate-950/60 rounded-3xl border border-slate-800/80 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="text-sm font-semibold">Đang tải cấu trúc sơ đồ môn học...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-500/10 p-6 text-sm text-rose-400 border border-rose-500/20 max-w-lg mx-auto text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[85vh]">
      <GraphCanvas
        curriculum={curriculum}
        layout={layout}
        selectedCourseCode={selectedCourseCode}
        setSelectedCourseCode={setSelectedCourseCode}
        dependencyPaths={dependencyPaths}
        zoom={zoom}
        pan={pan}
        isDragging={isDragging}
        handleMouseDown={handleMouseDown}
        handleMouseMove={handleMouseMove}
        handleMouseUp={handleMouseUp}
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        resetZoom={resetZoom}
        prereqs={prereqs}
      />
      <CourseInfoPanel selectedCourseDetails={selectedCourseDetails} />
    </div>
  );
};
