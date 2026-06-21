import type { SessionData } from "@/lib/auth/auth-types";

export function hasOrganizations(session: SessionData | null) {
  return Boolean(session?.activeOrganizationId);
}

export function resolvePostAuthDestination(session: SessionData) {
  if (!session.activeOrganizationId) {
    return "/onboarding/create-organization";
  }

  return "/app/dashboard";
}
