import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { User } from "../types";

type AuthValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

const tokenKey = "taskswift_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const nextUser = await api<User>("/auth/me", {}, token);
      setUser(nextUser);
    } catch {
      localStorage.removeItem(tokenKey);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUser();
  }, [token]);

  const value: AuthValue = {
    token,
    user,
    loading,
    login: async (email, password) => {
      const result = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem(tokenKey, result.token);
      setToken(result.token);
      setUser(result.user);
    },
    register: async (payload) => {
      const result = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      localStorage.setItem(tokenKey, result.token);
      setToken(result.token);
      setUser(result.user);
    },
    logout: () => {
      localStorage.removeItem(tokenKey);
      setToken(null);
      setUser(null);
    },
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}