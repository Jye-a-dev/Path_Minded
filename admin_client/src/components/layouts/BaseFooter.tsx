export default function BaseFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Cổng thông tin PathMinded</p>
        <p>Được xây dựng với React, Vite và Tailwind CSS.</p>
      </div>
    </footer>
  );
}
