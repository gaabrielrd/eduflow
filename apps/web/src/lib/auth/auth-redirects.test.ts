import { describe, expect, it } from "vitest";

import { hasOrganizations, resolvePostAuthDestination } from "@/lib/auth/auth-redirects";

describe("auth redirects", () => {
  it("sends users without organizations to onboarding", () => {
    expect(
      resolvePostAuthDestination({
        activeOrganizationId: null,
        organizations: [],
        user: {
          email: "user@eduflow.dev",
          id: "user-1",
          name: "User"
        }
      })
    ).toBe("/onboarding/create-organization");
  });

  it("recognizes a session with an active organization", () => {
    expect(
      hasOrganizations({
        activeOrganizationId: "org-a",
        organizations: [
          {
            id: "org-a",
            name: "Org A",
            role: "OWNER",
            slug: "org-a"
          }
        ],
        user: {
          email: "user@eduflow.dev",
          id: "user-1",
          name: "User"
        }
      })
    ).toBe(true);
  });
});
