import { describe, expect, it } from "vitest";

import {
  resolveActiveOrganizationId,
  resolvePostAuthDestination
} from "@/lib/auth/auth-redirects";
import type { OrganizationSummary } from "@/lib/auth/auth-types";

const organizations: OrganizationSummary[] = [
  {
    id: "org-a",
    name: "Org A",
    role: "OWNER",
    slug: "org-a"
  },
  {
    id: "org-b",
    name: "Org B",
    role: "ADMIN",
    slug: "org-b"
  }
];

describe("auth redirects", () => {
  it("uses the persisted organization when it is still valid", () => {
    expect(resolveActiveOrganizationId(organizations, "org-b")).toBe("org-b");
  });

  it("falls back to the first organization when the persisted one is missing", () => {
    expect(resolveActiveOrganizationId(organizations, "org-missing")).toBe("org-a");
  });

  it("sends users without organizations to onboarding", () => {
    expect(resolvePostAuthDestination([], "org-a")).toEqual({
      activeOrganizationId: null,
      redirectTo: "/onboarding/create-organization"
    });
  });
});
