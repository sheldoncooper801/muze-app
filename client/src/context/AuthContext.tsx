import { createContext, useContext, useState, useCallback } from "react";
import type { ArtistSession } from "@/lib/auth";
import { setToken, clearToken, getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

// ── Structured login error (carries needsVerification flag) ──────────────────
export class LoginError extends Error {
  needsVerification: boolean;
  constructor(message: string, needsVerification = false) {
    super(message);
    this.needsVerification = needsVerification;
  }
}

interface AuthContextType {
  artist: ArtistSession | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshArtist: () => Promise<void>;
}

// Admin emails — anyone listed here gets admin access after login
const ADMIN_EMAILS = ["sheldoncooper601@gmail.com", "sheldoncooper601@yahoo.com"];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [artist, setArtist] = useState<ArtistSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = artist ? ADMIN_EMAILS.includes(artist.email.toLowerCase()) : false;

  const refreshArtist = useCallback(async () => {
    if (!getToken()) return;
    try {
      // Use raw fetch so we can handle non-ok responses without throwing
      const { API_BASE } = await import("@/lib/queryClient").then(m => ({ API_BASE: (m as any).API_BASE ?? "" }));
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setArtist(data);
      } else {
        clearToken();
        setArtist(null);
      }
    } catch {
      clearToken();
      setArtist(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Use raw fetch (not apiRequest) so we can read the body even on non-2xx
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new LoginError(
          data.error || "Login failed",
          data.needsVerification === true,
        );
      }
      setToken(data.token);
      setArtist(data.artist);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setArtist(null);
  }, []);

  return (
    <AuthContext.Provider value={{ artist, isAdmin, isLoading, login, logout, refreshArtist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
