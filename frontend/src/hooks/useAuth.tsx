import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  devLogin: (userId: number, username?: string) => Promise<void>;
  telegramLogin: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => api.session(),
    staleTime: 60_000,
  });

  const refresh = () => qc.invalidateQueries();

  const value: AuthCtx = {
    user: data?.user ?? null,
    loading: isLoading,
    devLogin: async (userId, username) => {
      await api.devLogin(userId, username);
      await refresh();
    },
    telegramLogin: async (payload) => {
      await api.telegramLogin(payload);
      await refresh();
    },
    logout: async () => {
      await api.logout();
      await refresh();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
