import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "@/lib/api/api-client";

describe("apiClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes custom headers in outgoing requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true }),
      ok: true
    });

    vi.stubGlobal("fetch", fetchMock);

    await apiClient({
      headers: {
        Authorization: "Bearer token",
        "X-Organization-Id": "org-1"
      },
      path: "/api/auth/session"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/session",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer token",
          "X-Organization-Id": "org-1"
        })
      })
    );
  });

  it("retries once after a 401 when onUnauthorized recovers the session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({
          error: "Unauthorized",
          message: "Invalid authentication credentials"
        }),
        ok: false,
        status: 401
      })
      .mockResolvedValueOnce({
        json: async () => ({ session: { id: "ok" } }),
        ok: true
      });

    vi.stubGlobal("fetch", fetchMock);

    const onUnauthorized = vi.fn().mockResolvedValue(true);
    const response = await apiClient<{ session: { id: string } }>({
      onUnauthorized,
      path: "/api/auth/session"
    });

    expect(response.session.id).toBe("ok");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws the original ApiError when unauthorized recovery fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          error: "Unauthorized",
          message: "Invalid authentication credentials"
        }),
        ok: false,
        status: 401
      })
    );

    await expect(
      apiClient({
        onUnauthorized: async () => false,
        path: "/api/auth/session"
      })
    ).rejects.toBeInstanceOf(ApiError);
  });
});
