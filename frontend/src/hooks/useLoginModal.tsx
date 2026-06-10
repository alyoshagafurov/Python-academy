import { createContext, useContext, useState, type ReactNode } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

const Ctx = createContext<{ open: () => void } | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setOpen(true) }}>
      {children}
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  );
}

export function useLoginModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
