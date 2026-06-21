"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import {
  createOrganization,
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  setOrganization
} from "@/lib/auth/auth-service";
import type {
  CreateOrganizationPayload,
  LoginPayload,
  RegisterPayload,
  SessionData
} from "@/lib/auth/auth-types";

type AuthContextValue = {
  activeOrganizationId: string | null;
  createOrganization: (payload: CreateOrganizationPayload) => Promise<SessionData>;
  hasOrganization: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<SessionData>;
  logout: () => Promise<void>;
  organizations: SessionData["organizations"];
  refreshSession: () => Promise<SessionData | null>;
  register: (payload: RegisterPayload) => Promise<SessionData>;
  session: SessionData | null;
  setActiveOrganizationId: (organizationId: string) => Promise<SessionData | null>;
  user: SessionData["user"] | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialSession: SessionData | null;
};

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [session, setSession] = useState<SessionData | null>(initialSession);
  const [isLoading, setIsLoading] = useState(initialSession === null);

  useEffect(() => {
    if (initialSession) {
      return;
    }

    let isMounted = true;

    void getSession()
      .then((nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSession(null);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialSession]);

  async function login(payload: LoginPayload) {
    const nextSession = await loginUser(payload);
    setSession(nextSession);
    setIsLoading(false);

    return nextSession;
  }

  async function register(payload: RegisterPayload) {
    const nextSession = await registerUser(payload);
    setSession(nextSession);
    setIsLoading(false);

    return nextSession;
  }

  async function logout() {
    await logoutUser();
    setSession(null);
    setIsLoading(false);
  }

  async function refreshSession() {
    setIsLoading(true);

    try {
      const nextSession = await getSession();
      setSession(nextSession);

      return nextSession;
    } catch {
      setSession(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateOrganization(payload: CreateOrganizationPayload) {
    const nextSession = await createOrganization(payload);
    setSession(nextSession);
    setIsLoading(false);

    return nextSession;
  }

  async function setActiveOrganizationId(organizationId: string) {
    const nextSession = await setOrganization(organizationId);

    setSession(nextSession);

    return nextSession;
  }

  return (
    <AuthContext.Provider
      value={{
        activeOrganizationId: session?.activeOrganizationId ?? null,
        createOrganization: handleCreateOrganization,
        hasOrganization: Boolean(session?.activeOrganizationId),
        isAuthenticated: Boolean(session),
        isLoading,
        login,
        logout,
        organizations: session?.organizations ?? [],
        refreshSession,
        register,
        session,
        setActiveOrganizationId,
        user: session?.user ?? null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
