"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import { ACTIVE_ORGANIZATION_STORAGE_KEY } from "@/lib/auth/auth-storage";
import type { SessionSnapshot } from "@/lib/auth/auth-types";

type AuthContextValue = {
  accessToken: string | null;
  activeOrganizationId: string | null;
  clearSession: () => void;
  isHydrated: boolean;
  refreshToken: string | null;
  setActiveOrganizationId: (organizationId: string | null) => void;
  setSession: (session: SessionSnapshot) => void;
  user: SessionSnapshot["user"] | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SessionSnapshot["user"] | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const persistedOrganizationId = window.localStorage.getItem(
      ACTIVE_ORGANIZATION_STORAGE_KEY
    );

    setActiveOrganizationIdState(persistedOrganizationId);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (activeOrganizationId) {
      window.localStorage.setItem(
        ACTIVE_ORGANIZATION_STORAGE_KEY,
        activeOrganizationId
      );
      return;
    }

    window.localStorage.removeItem(ACTIVE_ORGANIZATION_STORAGE_KEY);
  }, [activeOrganizationId, isHydrated]);

  function setSession(session: SessionSnapshot) {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
  }

  function clearSession() {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }

  function setActiveOrganizationId(organizationId: string | null) {
    setActiveOrganizationIdState(organizationId);
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        activeOrganizationId,
        clearSession,
        isHydrated,
        refreshToken,
        setActiveOrganizationId,
        setSession,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
