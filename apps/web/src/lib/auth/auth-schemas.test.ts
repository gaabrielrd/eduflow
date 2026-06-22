import { describe, expect, it } from "vitest";

import {
  createInvitationSchema,
  createOrganizationSchema,
  loginSchema,
  registerSchema
} from "@/lib/auth/auth-schemas";

describe("auth schemas", () => {
  it("accepts valid login payloads", () => {
    const result = loginSchema.safeParse({
      email: "user@eduflow.dev",
      password: "strong-pass"
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid registration and organization payloads", () => {
    const registerResult = registerSchema.safeParse({
      email: "bad-email",
      name: "A",
      password: "123"
    });

    const organizationResult = createOrganizationSchema.safeParse({
      name: "A",
      slug: "___"
    });

    expect(registerResult.success).toBe(false);
    expect(organizationResult.success).toBe(false);
  });

  it("accepts valid invitation payloads and rejects OWNER", () => {
    const validResult = createInvitationSchema.safeParse({
      email: "invitee@eduflow.dev",
      role: "MANAGER"
    });
    const invalidResult = createInvitationSchema.safeParse({
      email: "invitee@eduflow.dev",
      role: "OWNER"
    });

    expect(validResult.success).toBe(true);
    expect(invalidResult.success).toBe(false);
  });
});
