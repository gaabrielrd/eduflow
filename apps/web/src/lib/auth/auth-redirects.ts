import type { OrganizationSummary } from "@/lib/auth/auth-types";

export function resolveActiveOrganizationId(
  organizations: OrganizationSummary[],
  persistedOrganizationId: string | null
) {
  if (persistedOrganizationId) {
    const matchingOrganization = organizations.find(
      (organization) => organization.id === persistedOrganizationId
    );

    if (matchingOrganization) {
      return matchingOrganization.id;
    }
  }

  return organizations[0]?.id ?? null;
}

export function resolvePostAuthDestination(
  organizations: OrganizationSummary[],
  persistedOrganizationId: string | null
) {
  const activeOrganizationId = resolveActiveOrganizationId(
    organizations,
    persistedOrganizationId
  );

  if (!activeOrganizationId) {
    return {
      activeOrganizationId: null,
      redirectTo: "/onboarding/create-organization"
    } as const;
  }

  return {
    activeOrganizationId,
    redirectTo: "/app/dashboard"
  } as const;
}
