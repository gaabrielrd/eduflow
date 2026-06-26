import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/api-client";
import {
  deleteMediaAsset,
  listMediaAssets
} from "@/lib/media/media-library-service";
import type { MediaAsset } from "@/lib/media/media-types";

vi.mock("@/lib/api/api-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/api-client")>(
    "@/lib/api/api-client"
  );

  return {
    ...actual,
    apiClient: vi.fn()
  };
});

const apiClientMock = vi.mocked(apiClient);

const mediaAsset: MediaAsset = {
  createdAt: "2026-06-26T10:00:00.000Z",
  fileName: "hero.png",
  id: "media-1",
  mimeType: "image/png",
  originalName: "Hero.png",
  sizeBytes: 2048,
  status: "READY",
  updatedAt: "2026-06-26T10:00:00.000Z"
};

describe("mediaLibraryService", () => {
  it("lists media assets through the web BFF route", async () => {
    apiClientMock.mockResolvedValueOnce([mediaAsset]);

    await expect(listMediaAssets()).resolves.toEqual([mediaAsset]);
    expect(apiClientMock).toHaveBeenCalledWith({
      method: "GET",
      path: "/api/media"
    });
  });

  it("deletes a media asset through the web BFF route", async () => {
    apiClientMock.mockResolvedValueOnce({
      ...mediaAsset,
      status: "DELETED"
    });

    await expect(deleteMediaAsset("media-1")).resolves.toEqual({
      ...mediaAsset,
      status: "DELETED"
    });
    expect(apiClientMock).toHaveBeenCalledWith({
      method: "DELETE",
      path: "/api/media/media-1"
    });
  });
});
