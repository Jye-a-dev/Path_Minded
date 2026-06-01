import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";

export default function BaseNavbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 transition hover:text-zinc-600"
        >
          PathMinded
        </Link>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                "rounded-full px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              ].join(" ")
            }
          >
            Trang chủ
          </NavLink>

          {isAuthenticated ? (
            <NavLink
              to="/me"
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")
              }
            >
              Trang cá nhân
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                ].join(" ")
              }
            >
              Đăng nhập
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
