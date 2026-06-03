import PublicLayout from "../components/layouts/(public)/PublicLayout";
import AdminLayout from "../components/layouts/AdminLayout";
import { PrivateRoute } from "../components/guards/PrivateRoute";

// Public pages
import Home from "../pages/public/Home/Home";
import Login from "../pages/public/Login/Login";

// Admin pages
import Dashboard from "../pages/admin/Dashboard/Dashboard";
import Users from "../pages/admin/Users/Users";
import Advisors from "../pages/admin/Advisors/Advisors";
import Programs from "../pages/admin/Programs/Programs";
import Classes from "../pages/admin/Classes/Classes";
import Students from "../pages/admin/Students/Students";
import CurriculumCourses from "../pages/admin/CurriculumCourses/CurriculumCourses";
import CoursePrerequisites from "../pages/admin/CoursePrerequisites/CoursePrerequisites";
import CourseEquivalencies from "../pages/admin/CourseEquivalencies/CourseEquivalencies";
import StudentCourseResults from "../pages/admin/StudentCourseResults/StudentCourseResults";
import CurriculumImports from "../pages/admin/CurriculumImports/CurriculumImports";
import TranscriptUploads from "../pages/admin/TranscriptUploads/TranscriptUploads";
import ClassImports from "../pages/admin/ClassImports/ClassImports";

import Exports from "../pages/admin/Exports/Exports";
import ExportLogs from "../pages/admin/ExportLogs/ExportLogs";
import ParseWarnings from "../pages/admin/ParseWarnings/ParseWarnings";
import ColumnMappings from "../pages/admin/ColumnMappings/ColumnMappings";
import CourseTypeMappings from "../pages/admin/CourseTypeMappings/CourseTypeMappings";
import KnowledgeBlockMappings from "../pages/admin/KnowledgeBlockMappings/KnowledgeBlockMappings";
import Profile from "../pages/admin/Profile/Profile";

const routes = [
  // Public Routes
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
    ],
  },
  
  // Protected Admin Routes
  {
    path: "/admin",
    element: <PrivateRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "me", element: <Profile /> },
          { path: "users", element: <Users /> },
          { path: "advisors", element: <Advisors /> },
          { path: "programs", element: <Programs /> },
          { path: "classes", element: <Classes /> },
          { path: "students", element: <Students /> },
          { path: "curriculum_courses", element: <CurriculumCourses /> },
          { path: "course_prerequisites", element: <CoursePrerequisites /> },
          { path: "course_equivalencies", element: <CourseEquivalencies /> },
          { path: "student_course_results", element: <StudentCourseResults /> },
          { path: "curriculum_imports", element: <CurriculumImports /> },
          { path: "transcript_uploads", element: <TranscriptUploads /> },
          { path: "class_imports", element: <ClassImports /> },

          { path: "exports", element: <Exports /> },
          { path: "export_logs", element: <ExportLogs /> },
          { path: "parse_warnings", element: <ParseWarnings /> },
          { path: "column_mappings", element: <ColumnMappings /> },
          { path: "course_type_mappings", element: <CourseTypeMappings /> },
          { path: "knowledge_block_mappings", element: <KnowledgeBlockMappings /> },
        ],
      },
    ],
  },
];

export default routes;