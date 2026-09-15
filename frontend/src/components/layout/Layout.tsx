import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";
import { LoginModalProvider } from "@/hooks/useLoginModal";
import { LessonPrefetch } from "@/components/LessonPrefetch";
import { Navbar } from "./Navbar";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { Footer } from "./Footer";

const loadMotionFeatures = () => import("@/lib/motionFeatures").then((mod) => mod.default);

export function Layout({ children }: { children: ReactNode }) {
  return (
    // `m` components + domAnimation keep framer-motion out of the home page's
    // JS budget; `strict` throws if a full `motion` component sneaks back in.
    <LazyMotion features={loadMotionFeatures} strict>
      <LoginModalProvider>
        <LessonPrefetch />
        <RouteAnnouncer />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-bg focus:px-4 focus:py-3 focus:text-body focus:text-fg"
        >
          Перейти к содержанию
        </a>
        <div className="flex min-h-dvh flex-col">
          <Navbar />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer />
        </div>
      </LoginModalProvider>
    </LazyMotion>
  );
}
