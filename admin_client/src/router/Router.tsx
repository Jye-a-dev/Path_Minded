import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { useRoutes, Navigate } from "react-router-dom";
import PublicLayout from "../components/layouts/(public)/PublicLayout";
import AdminLayout from "../components/layouts/AdminLayout";
import { PrivateRoute } from "../components/guards/PrivateRoute";
import PageLoader from "./PageLoader";
import SettingsPage from "../pages/admin/Settings/Settings";

// Public pages
const Home = lazy(() => import("../pages/public/Home/Home"));
const Login = lazy(() => import("../pages/public/Login/Login"));

// Admin pages
const Dashboard = lazy(() => import("../pages/admin/Dashboard/Dashboard"));
const Users = lazy(() => import("../pages/admin/Users/Users"));
const Advisors = lazy(() => import("../pages/admin/Advisors/Advisors"));
const Programs = lazy(() => import("../pages/admin/Programs/Programs"));
const Classes = lazy(() => import("../pages/admin/Classes/Classes"));
const Students = lazy(() => import("../pages/admin/Students/Students"));
const CurriculumCourses = lazy(() => import("../pages/admin/CurriculumCourses/CurriculumCourses"));
const CoursePrerequisites = lazy(() => import("../pages/admin/CoursePrerequisites/CoursePrerequisites"));
const CourseEquivalencies = lazy(() => import("../pages/admin/CourseEquivalencies/CourseEquivalencies"));
const StudentCourseResults = lazy(() => import("../pages/admin/StudentCourseResults/StudentCourseResults"));
const TranscriptUploads = lazy(() => import("../pages/admin/TranscriptUploads/TranscriptUploads"));
const ClassImports = lazy(() => import("../pages/admin/ClassImports/ClassImports"));
const Exports = lazy(() => import("../pages/admin/Exports/Exports"));
const ExportLogs = lazy(() => import("../pages/admin/ExportLogs/ExportLogs"));
const ParseWarnings = lazy(() => import("../pages/admin/ParseWarnings/ParseWarnings"));
const ColumnMappings = lazy(() => import("../pages/admin/ColumnMappings/ColumnMappings"));
const CourseTypeMappings = lazy(() => import("../pages/admin/CourseTypeMappings/CourseTypeMappings"));
const KnowledgeBlockMappings = lazy(() => import("../pages/admin/KnowledgeBlockMappings/KnowledgeBlockMappings"));
const Profile = lazy(() => import("../pages/admin/Profile/Profile"));

const w = (el: ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

const routes = [
  // Public Routes
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: w(<Home />) },
      { path: "login", element: w(<Login />) },
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
          { index: true, element: w(<Dashboard />) },
          { path: "me", element: w(<Profile />) },
          { path: "users", element: w(<Users />) },
          { path: "advisors", element: w(<Advisors />) },
          { path: "programs", element: w(<Programs />) },
          { path: "classes", element: w(<Classes />) },
          { path: "students", element: w(<Students />) },
          { path: "curriculum_courses", element: w(<CurriculumCourses />) },
          { path: "course_prerequisites", element: w(<CoursePrerequisites />) },
          { path: "course_equivalencies", element: w(<CourseEquivalencies />) },
          { path: "student_course_results", element: w(<StudentCourseResults />) },
          { path: "curriculum_imports", element: <Navigate to="/admin/programs?tab=imports" replace /> },
          { path: "transcript_uploads", element: w(<TranscriptUploads />) },
          { path: "class_imports", element: w(<ClassImports />) },
          { path: "exports", element: w(<Exports />) },
          { path: "export_logs", element: w(<ExportLogs />) },
          { path: "parse_warnings", element: w(<ParseWarnings />) },
          { path: "column_mappings", element: w(<ColumnMappings />) },
          { path: "course_type_mappings", element: w(<CourseTypeMappings />) },
          { path: "knowledge_block_mappings", element: w(<KnowledgeBlockMappings />) },
          { path: "settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
];

export default function AppRouter() {
  return useRoutes(routes);
}