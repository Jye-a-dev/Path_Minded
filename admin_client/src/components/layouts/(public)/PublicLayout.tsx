import { Outlet, useLocation } from "react-router-dom";
import PublicFooter from "./Footer/PublicFooter";
import PublicNavbar from "./Navbar/PublicNavbar";

export default function PublicLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className={`flex min-h-screen flex-col transition-colors duration-500 ${isLoginPage ? "bg-[#090a0f] text-slate-100" : "bg-zinc-50 text-zinc-900"}`}>
      <PublicNavbar />
      <main className={`flex flex-1 w-full transition-all duration-500 ${isLoginPage ? "px-0 py-0" : "mx-auto max-w-6xl px-4 py-8 md:py-10"}`}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

