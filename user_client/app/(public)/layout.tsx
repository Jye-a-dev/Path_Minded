import type { ReactNode } from "react";
import PublicSetup from "@/components/layouts/(public)/PublicSetup";

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-350 flex-col border-x border-neutral-200 bg-white">
      <PublicSetup>{children}</PublicSetup>
    </div>
  );
}
