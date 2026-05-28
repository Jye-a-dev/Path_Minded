import React from "react";

export interface NavbarProps {
  className?: string;
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export default function Navbar({
  className = "relative w-full max-w-5xl mx-auto rounded-2xl border border-zinc-200/80 bg-white/70 shadow-lg shadow-zinc-200/5 px-6 py-3.5 backdrop-blur-md flex items-center justify-between transition-all hover:border-zinc-300",
  leftContent,
  rightContent,
  children,
}: NavbarProps) {
  return (
    <div className="relative pt-6 px-6 md:px-8 shrink-0 z-30 select-none">
      <header className={className}>
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-center gap-4">
              {leftContent}
            </div>
            <div className="flex items-center gap-3">
              {rightContent}
            </div>
          </>
        )}
      </header>
    </div>
  );
}
