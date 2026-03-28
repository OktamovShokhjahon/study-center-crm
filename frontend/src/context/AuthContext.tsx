"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearStoredAuth, getStoredToken, setStoredAuth } from "@/lib/api";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export type AuthUser = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  centerId: string;
  language?: string;
  theme?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    try {
      const token = getStoredToken();
      const raw = localStorage.getItem("crm_user");
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      setState({ user: token && user ? user : null, token: token && user ? token : null, loading: false });
    } catch {
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  const login = useCallback((token: string, user: AuthUser) => {
    setStoredAuth(token, JSON.stringify(user));
    setState({ token, user, loading: false });
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setState({ user: null, token: null, loading: false });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
