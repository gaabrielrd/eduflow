import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

function createRequest(path: string, cookieHeader?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined
  });
}

describe("middleware", () => {
  it("redirects unauthenticated users away from /app/dashboard", () => {
    const response = proxy(createRequest("/app/dashboard"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects authenticated users without organization to onboarding", () => {
    const response = proxy(
      createRequest("/app/dashboard", "eduflow.accessToken=token")
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/onboarding/create-organization"
    );
  });

  it("allows authenticated users with organization into /app/dashboard", () => {
    const response = proxy(
      createRequest(
        "/app/dashboard",
        "eduflow.accessToken=token; eduflow.activeOrganizationId=org-1"
      )
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects authenticated users away from /login", () => {
    const response = proxy(
      createRequest(
        "/login",
        "eduflow.accessToken=token; eduflow.activeOrganizationId=org-1"
      )
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost/app/dashboard"
    );
  });
});
