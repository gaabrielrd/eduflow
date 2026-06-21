"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useSession } from "@/hooks/use-session";

type GuardVariant =
  | "public-auth"
  | "session-only"
  | "session-with-organization"
  | "session-without-organization";

type RouteGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  variant: GuardVariant;
};

function DefaultFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-slate-500">Carregando fluxo...</p>
    </div>
  );
}

export function RouteGuard({
  children,
  fallback = <DefaultFallback />,
  variant
}: RouteGuardProps) {
  const router = useRouter();
  const { hasOrganization, isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (variant === "public-auth" && isAuthenticated) {
      router.replace(hasOrganization ? "/app/dashboard" : "/onboarding/create-organization");
      return;
    }

    if (
      (variant === "session-only" ||
        variant === "session-with-organization" ||
        variant === "session-without-organization") &&
      !isAuthenticated
    ) {
      router.replace("/login");
      return;
    }

    if (variant === "session-with-organization" && !hasOrganization) {
      router.replace("/onboarding/create-organization");
      return;
    }

    if (variant === "session-without-organization" && hasOrganization) {
      router.replace("/app/dashboard");
    }
  }, [hasOrganization, isAuthenticated, isLoading, router, variant]);

  if (isLoading) {
    return fallback;
  }

  if (variant === "public-auth" && isAuthenticated) {
    return fallback;
  }

  if (
    (variant === "session-only" ||
      variant === "session-with-organization" ||
      variant === "session-without-organization") &&
    !isAuthenticated
  ) {
    return fallback;
  }

  if (variant === "session-with-organization" && !hasOrganization) {
    return fallback;
  }

  if (variant === "session-without-organization" && hasOrganization) {
    return fallback;
  }

  return <>{children}</>;
}
