import { Link } from "react-router-dom";

export default function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/70 py-8 text-zinc-500 text-xs select-none">
      <div className="mx-auto max-w-5xl w-full px-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-zinc-800 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded bg-indigo-600"></span>
            PathMinded Advising Platform
          </p>
          <p className="mt-1 text-zinc-500 font-medium">Automatic syllabus auditing and matricial course prerequisite checks.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-zinc-600 font-bold">
          <Link to="/" className="hover:text-indigo-600 transition-colors">Home</Link>
          <Link to="/admin" className="hover:text-indigo-600 transition-colors">Portal Dashboard</Link>
          <Link to="/login" className="hover:text-indigo-600 transition-colors">Advisors Sign In</Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl w-full px-6 mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200/50 pt-4 text-[10px] uppercase tracking-wider text-zinc-550 font-bold">
        <span>© {new Date().getFullYear()} PathMinded Inc. All rights reserved.</span>
        <span className="flex items-center gap-1.5 mt-2 sm:mt-0">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          Ingestion System Live
        </span>
      </div>
    </footer>
  );
}
