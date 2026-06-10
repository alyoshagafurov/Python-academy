import type { ReactNode } from "react";
import { LoginModalProvider } from "@/hooks/useLoginModal";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <LoginModalProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </LoginModalProvider>
  );
}
