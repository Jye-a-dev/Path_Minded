import { Outlet } from "react-router-dom";
import PublicFooter from "./Footer/PublicFooter";
import PublicNavbar from "./Navbar/PublicNavbar";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <PublicNavbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 md:py-10">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
