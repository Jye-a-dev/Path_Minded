import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";

type ProvidersProps = {
  children: ReactNode;
};

function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

export default Providers;