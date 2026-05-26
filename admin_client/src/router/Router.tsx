import PublicLayout from "../components/layouts/(public)/PublicLayout";
import AdminLayout from "../components/layouts/(admin)/AdminLayout";
import { PrivateRoute } from "../components/guards/PrivateRoute";

// Public pages
import Home from "../app/(public)/Home/Home";
import Login from "../app/(public)/Login/Login";

// Admin pages
import Dashboard from "../app/(user)/Dashboard/Dashboard";
import Users from "../app/(user)/Users/Users";
import Advisors from "../app/(user)/Advisors/Advisors";
import Programs from "../app/(user)/Programs/Programs";
import Classes from "../app/(user)/Classes/Classes";
import Students from "../app/(user)/Students/Students";
import CurriculumCourses from "../app/(user)/CurriculumCourses/CurriculumCourses";
import CoursePrerequisites from "../app/(user)/CoursePrerequisites/CoursePrerequisites";
import CourseEquivalencies from "../app/(user)/CourseEquivalencies/CourseEquivalencies";
import StudentCourseResults from "../app/(user)/StudentCourseResults/StudentCourseResults";
import CurriculumImports from "../app/(user)/CurriculumImports/CurriculumImports";
import TranscriptUploads from "../app/(user)/TranscriptUploads/TranscriptUploads";
import ClassImports from "../app/(user)/ClassImports/ClassImports";
import ClassImportRows from "../app/(user)/ClassImportRows/ClassImportRows";
import Exports from "../app/(user)/Exports/Exports";
import ExportLogs from "../app/(user)/ExportLogs/ExportLogs";
import ParseWarnings from "../app/(user)/ParseWarnings/ParseWarnings";

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
          { path: "class_import_rows", element: <ClassImportRows /> },
          { path: "exports", element: <Exports /> },
          { path: "export_logs", element: <ExportLogs /> },
          { path: "parse_warnings", element: <ParseWarnings /> },
        ],
      },
    ],
  },
];

export default routes;