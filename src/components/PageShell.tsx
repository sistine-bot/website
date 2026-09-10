import { Header } from "./Header";
import { Footer } from "./Footer";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink font-body antialiased selection:bg-berry/20 selection:text-ink">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
