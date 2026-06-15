import React, { useState, useMemo, useRef, useEffect } from "react";
import { CurriculumCourse, CourseResult, PrerequisiteRule } from "./simulator/components/types";
import { GraphCanvas } from "./components/GraphCanvas";
import { CourseInfoPanel } from "./components/CourseInfoPanel";

interface InteractiveGraphProps {
  curriculum: CurriculumCourse[];
  results: CourseResult[];
  prereqs: PrerequisiteRule[];
  onSimulateFailure?: (courseCode: string) => void;
}

export function InteractiveGraph({ curriculum, results, prereqs, onSimulateFailure }: InteractiveGraphProps) {
  // Navigation Zoom and Pan
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Selection state
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  // Expand state
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close expand mode on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // Dynamically elevate z-index of layout ancestors to escape stacking contexts when expanded
  useEffect(() => {
    if (!isExpanded || !containerRef.current) return;

    let parent = containerRef.current.parentElement;
    const modifiedElements: HTMLElement[] = [];

    while (parent && parent !== document.body) {
      const hasZIndexClass = Array.from(parent.classList).some(cls => cls.startsWith("z-"));
      if (hasZIndexClass) {
        const originalZIndex = parent.style.zIndex;
        parent.style.zIndex = "9999";
        parent.setAttribute("data-orig-z", originalZIndex);
        modifiedElements.push(parent);
      }
      parent = parent.parentElement;
    }

    return () => {
      modifiedElements.forEach(el => {
        const orig = el.getAttribute("data-orig-z");
        if (orig !== null && orig !== "") {
          el.style.zIndex = orig;
        } else {
          el.style.removeProperty("z-index");
        }
        el.removeAttribute("data-orig-z");
      });
    };
  }, [isExpanded]);

  // Compute status for each course
  const courseStatusMap = useMemo(() => {
    const statusMap = new Map<string, "PASSED" | "STUDYING" | "FAILED" | "MISSING" | "LOCKED">();
    const passedCodes = new Set<string>();
    const studyingCodes = new Set<string>();
    const failedCodes = new Set<string>();

    results.forEach((r) => {
      if (r.status === "PASSED") passedCodes.add(r.course_code);
      else if (r.status === "STUDYING") studyingCodes.add(r.course_code);
      else if (r.status === "FAILED") failedCodes.add(r.course_code);
    });

    // Determine lock status: a course is locked if it has prerequisites and at least one is not PASSED
    const prereqMap = new Map<string, string[]>();
    prereqs.forEach((rule) => {
      if (!prereqMap.has(rule.course_code)) {
        prereqMap.set(rule.course_code, []);
      }
      prereqMap.get(rule.course_code)!.push(rule.prerequisite_course_code);
    });

    curriculum.forEach((c) => {
      const code = c.course_code;
      if (passedCodes.has(code)) {
        statusMap.set(code, "PASSED");
      } else if (studyingCodes.has(code)) {
        statusMap.set(code, "STUDYING");
      } else if (failedCodes.has(code)) {
        statusMap.set(code, "FAILED");
      } else {
        // Check if unlocked or locked
        const coursePrereqs = prereqMap.get(code) || [];
        const isLocked = coursePrereqs.length > 0 && coursePrereqs.some(p => !passedCodes.has(p));
        statusMap.set(code, isLocked ? "LOCKED" : "MISSING");
      }
    });

    return statusMap;
  }, [curriculum, results, prereqs]);

  const COL_WIDTH = 240;
  const ROW_HEIGHT = 92;

  // Compute dynamic maximum semester from curriculum
  const maxSem = useMemo(() => {
    return curriculum.reduce((max, c) => {
      const sem = c.expected_semester || 0;
      return sem > max ? sem : max;
    }, 8); // Default to at least 8 semesters
  }, [curriculum]);

  // Compute layout positions for each course
  const layout = useMemo(() => {
    const semesters: Record<number, CurriculumCourse[]> = {};
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
    const paddingLeft = 50;
    const paddingTop = 60;

    // Calculate maximum rows to center others vertically
    let maxRows = 0;
    Object.values(semesters).forEach((list) => {
      if (list.length > maxRows) maxRows = list.length;
    });

    Object.keys(semesters).forEach((semKey) => {
      const semNum = parseInt(semKey, 10);
      const list = semesters[semNum];
      const colX = paddingLeft + (semNum - 1) * COL_WIDTH;

      // Vertical centering inside the canvas
      const totalColHeight = list.length * ROW_HEIGHT;
      const maxColHeight = maxRows * ROW_HEIGHT;
      const startY = paddingTop + (maxColHeight - totalColHeight) / 2;

      list.forEach((c, index) => {
        positions[c.course_code] = {
          x: colX,
          y: startY + index * ROW_HEIGHT,
        };
      });
    });

    return positions;
  }, [curriculum, maxSem]);

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

    const status = courseStatusMap.get(selectedCourseCode) || "MISSING";
    const directPrereqs = prereqs
      .filter((r) => r.course_code === selectedCourseCode)
      .map((r) => {
        const found = curriculum.find((c) => c.course_code === r.prerequisite_course_code);
        return {
          code: r.prerequisite_course_code,
          name: found ? found.course_name : "Môn học chưa rõ",
        };
      });

    const directDependents = prereqs
      .filter((r) => r.prerequisite_course_code === selectedCourseCode)
      .map((r) => {
        const found = curriculum.find((c) => c.course_code === r.course_code);
        return {
          code: r.course_code,
          name: found ? found.course_name : "Môn học chưa rõ",
        };
      });

    const outDegree = prereqs.filter((r) => r.prerequisite_course_code === selectedCourseCode).length;

    return {
      ...course,
      status,
      prerequisites: directPrereqs,
      dependents: directDependents,
      outDegree,
    };
  }, [selectedCourseCode, curriculum, courseStatusMap, prereqs]);

  return (
    <div
      ref={containerRef}
      className={
        isExpanded
          ? "fixed inset-0 bg-[#f6f4ef] p-6 flex flex-col lg:flex-row gap-6"
          : "flex flex-col lg:flex-row gap-6 h-[85vh]"
      }
      style={isExpanded ? { zIndex: 9999 } : undefined}
    >
      <GraphCanvas
        curriculum={curriculum}
        layout={layout}
        courseStatusMap={courseStatusMap}
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
        setZoom={setZoom}
        isExpanded={isExpanded}
        onToggleExpand={toggleExpand}
        maxSem={maxSem}
        colWidth={COL_WIDTH}
      />
      <CourseInfoPanel
        selectedCourseDetails={selectedCourseDetails}
        onSimulateFailure={onSimulateFailure}
      />
    </div>
  );
}
