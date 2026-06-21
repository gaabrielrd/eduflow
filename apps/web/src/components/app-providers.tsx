"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import type { SessionData } from "@/lib/auth/auth-types";

type AppProvidersProps = {
  children: ReactNode;
  initialSession: SessionData | null;
};

export function AppProviders({ children, initialSession }: AppProvidersProps) {
  return <AuthProvider initialSession={initialSession}>{children}</AuthProvider>;
}
