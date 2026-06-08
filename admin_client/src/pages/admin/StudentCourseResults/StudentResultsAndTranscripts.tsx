import React, { useState, useEffect } from "react";
import { useStudents } from "../../../hooks/useStudents";
import type { StudentItem } from "../../../hooks/useStudents";
import { StudentResultsTab } from "./components/StudentResultsTab";
import { TranscriptUploadsTab } from "./components/TranscriptUploadsTab";
import { api } from "../../../services/api";

import { ConfigurationCard } from "./components/ConfigurationCard";
import type { ProgramItem, ClassItem } from "./components/ConfigurationCard";
import { StudentListTable } from "./components/StudentListTable";
import { StudentDetailHeader } from "./components/StudentDetailHeader";

interface StudentResultsAndTranscriptsProps {
  initialTab?: "results" | "uploads";
}

export default function StudentResultsAndTranscripts({
  initialTab = "results",
}: StudentResultsAndTranscriptsProps) {
  // Hooks for fetching
  const studentsHook = useStudents();

  // Setup screen states
  const [isConfigured, setIsConfigured] = useState(false);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  
  // Student detail state
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [selectedStudentProgramId, setSelectedStudentProgramId] = useState("");
  const [activeTab, setActiveTab] = useState<"results" | "uploads">(initialTab);

  // Lists for dropdown selectors
  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Student list filter states
  const [gradeStatusFilter, setGradeStatusFilter] = useState<string>("");
  const [studyStatusFilter, setStudyStatusFilter] = useState<string>("");

  // Load programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoadingPrograms(true);
      try {
        const response = await api.get("/programs?limit=250");
        setAllPrograms(response.data || []);
      } catch (err) {
        console.error("Failed to load programs:", err);
      } finally {
        setLoadingPrograms(false);
      }
    };
    void fetchPrograms();
  }, []);

  // Load classes when major changes
  useEffect(() => {
    if (!selectedMajor) return;
    const fetchClasses = async () => {
      setLoadingClasses(true);
      try {
        const majorPrograms = allPrograms.filter((p) => p.major_name === selectedMajor);
        const promises = majorPrograms.map((p) =>
          api.get<ClassItem[]>(`/classes?limit=100&program_id=${p.id}`)
        );
        const results = await Promise.all(promises);
        const allClasses = results.flatMap((r) => r.data || []);
        const uniqueClasses = Array.from(new Map(allClasses.map((c) => [c.id, c])).values());
        setClassesList(uniqueClasses);
      } catch (err) {
        console.error("Failed to fetch classes list:", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    void fetchClasses();
  }, [selectedMajor, allPrograms]);

  // Sync Student Hooks when class selection confirmed
  const handleConfirmConfig = () => {
    if (selectedClassId) {
      studentsHook.updateFilters({
        class_id: selectedClassId,
        status: studyStatusFilter || undefined,
        has_grades: gradeStatusFilter || undefined,
      });
      setIsConfigured(true);
    }
  };

  const handleResetConfig = () => {
    setIsConfigured(false);
    setSelectedClassId("");
    setSelectedStudentId("");
    setSelectedStudent(null);
    setClassesList([]);
    setGradeStatusFilter("");
    setStudyStatusFilter("");
    studentsHook.updateFilters({ class_id: undefined, status: undefined, has_grades: undefined });
  };

  // Sync student filter in hook when dropdowns change (if configured)
  const handleStudentGradeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGradeStatusFilter(val);
    if (isConfigured) {
      studentsHook.updateFilters({ has_grades: val || undefined });
    }
  };

  const handleStudentStudyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStudyStatusFilter(val);
    if (isConfigured) {
      studentsHook.updateFilters({ status: val || undefined });
    }
  };

  // Selection handler to open detail view
  const handleOpenStudentDetail = (student: StudentItem, tab: "results" | "uploads") => {
    setSelectedStudent(student);
    setSelectedStudentProgramId(student.program_id || "");
    setSelectedStudentId(student.id);
    setActiveTab(tab);
  };

  const handleBackToStudentList = () => {
    setSelectedStudent(null);
    setSelectedStudentId("");
    setSelectedStudentProgramId("");
    // Refresh student list to update has_grades status badge
    void studentsHook.refresh();
  };

  // Callback to refresh the student detail presence info or lists
  const handleRefreshStudentData = async () => {
    if (!selectedStudentId) return;
    try {
      const response = await api.get<StudentItem>(`/students/${selectedStudentId}`);
      if (response.data) {
        setSelectedStudent(response.data);
      }
    } catch (err) {
      console.error("Failed to refresh student detail status:", err);
    }
  };

  // Config View
  if (!isConfigured) {
    return (
      <ConfigurationCard
        loadingPrograms={loadingPrograms}
        allPrograms={allPrograms}
        selectedMajor={selectedMajor}
        setSelectedMajor={setSelectedMajor}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        loadingClasses={loadingClasses}
        classesList={classesList}
        handleConfirmConfig={handleConfirmConfig}
      />
    );
  }

  const currentClassName = classesList.find((c) => c.id === selectedClassId)?.class_code ?? selectedClassId;

  // MAIN RENDER: Student List Screen
  if (!selectedStudentId) {
    return (
      <StudentListTable
        studentsHook={studentsHook}
        gradeStatusFilter={gradeStatusFilter}
        studyStatusFilter={studyStatusFilter}
        handleStudentGradeFilterChange={handleStudentGradeFilterChange}
        handleStudentStudyFilterChange={handleStudentStudyFilterChange}
        handleResetConfig={handleResetConfig}
        selectedMajor={selectedMajor}
        currentClassName={currentClassName}
        handleOpenStudentDetail={handleOpenStudentDetail}
      />
    );
  }

  // DETAIL SCREEN: Student Detail View
  const selectedStudentLabel = selectedStudent
    ? `${selectedStudent.student_code} - ${selectedStudent.full_name}`
    : selectedStudentId;

  return (
    <div className="space-y-6">
      <StudentDetailHeader
        selectedStudent={selectedStudent}
        currentClassName={currentClassName}
        selectedMajor={selectedMajor}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleBackToStudentList={handleBackToStudentList}
      />

      {/* RENDER ACTIVE TAB WITH COMPOSITION */}
      {activeTab === "results" ? (
        <StudentResultsTab
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          programId={selectedStudentProgramId}
          onRefreshList={handleRefreshStudentData}
        />
      ) : (
        <TranscriptUploadsTab
          studentId={selectedStudentId}
          studentLabel={selectedStudentLabel}
          onUploadSuccess={handleRefreshStudentData}
          onDeleteSuccess={handleRefreshStudentData}
        />
      )}
    </div>
  );
}
