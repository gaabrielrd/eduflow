import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiClient } from "@/lib/api/api-client";
import {
  isMediaUploadAbortError,
  uploadMediaAsset
} from "@/lib/media/media-upload-service";
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

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];

  readonly headers: Record<string, string> = {};
  readonly uploadListeners = new Map<string, Array<(event: ProgressEvent) => void>>();
  readonly upload = {
    addEventListener: (type: string, listener: (event: ProgressEvent) => void) => {
      const listeners = this.uploadListeners.get(type) ?? [];
      listeners.push(listener);
      this.uploadListeners.set(type, listeners);
    }
  };

  method = "";
  onabort: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  sentBody: File | null = null;
  status = 0;
  url = "";

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }

  static reset() {
    MockXMLHttpRequest.instances = [];
  }

  abort() {
    this.onabort?.();
  }

  emitProgress(loaded: number, total: number) {
    const listeners = this.uploadListeners.get("progress") ?? [];

    listeners.forEach((listener) => {
      listener({
        lengthComputable: true,
        loaded,
        total
      } as ProgressEvent);
    });
  }

  fail() {
    this.onerror?.();
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  send(body: File) {
    this.sentBody = body;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  succeed(status = 200) {
    this.status = status;
    this.onload?.();
  }
}

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

describe("uploadMediaAsset", () => {
  beforeEach(() => {
    vi.stubGlobal("XMLHttpRequest", MockXMLHttpRequest);
    window.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
    MockXMLHttpRequest.reset();
    apiClientMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads the file through presign, storage upload, and complete", async () => {
    apiClientMock
      .mockResolvedValueOnce({
        headers: {
          "content-type": "image/png"
        },
        id: "media-1",
        method: "PUT",
        uploadUrl: "https://storage.example.com/upload"
      })
      .mockResolvedValueOnce(mediaAsset);

    const phaseChanges = vi.fn();
    const progressUpdates = vi.fn();
    const file = new File(["hello"], "hero.png", { type: "image/png" });

    const uploadPromise = uploadMediaAsset({
      file,
      onPhaseChange: phaseChanges,
      onProgress: progressUpdates
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest.instances).toHaveLength(1);
    });

    const xhr = MockXMLHttpRequest.instances[0];
    xhr.emitProgress(1, 2);
    xhr.succeed();

    await expect(uploadPromise).resolves.toEqual(mediaAsset);
    expect(apiClientMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        body: {
          fileName: "hero.png",
          mimeType: "image/png",
          sizeBytes: file.size
        },
        method: "POST",
        path: "/api/media/presign"
      })
    );
    expect(apiClientMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        body: {
          mediaId: "media-1"
        },
        method: "POST",
        path: "/api/media/complete"
      })
    );
    expect(phaseChanges).toHaveBeenNthCalledWith(1, "presigning");
    expect(phaseChanges).toHaveBeenNthCalledWith(2, "uploading");
    expect(phaseChanges).toHaveBeenNthCalledWith(3, "completing");
    expect(progressUpdates).toHaveBeenCalledWith(50);
    expect(progressUpdates).toHaveBeenCalledWith(100);
  });

  it("propagates presign failures", async () => {
    apiClientMock.mockRejectedValueOnce(
      new ApiError("Unsupported MIME type", 400, "Bad Request", [
        "Unsupported MIME type"
      ])
    );

    await expect(
      uploadMediaAsset({
        file: new File(["hello"], "archive.zip", { type: "application/zip" })
      })
    ).rejects.toMatchObject({
      message: "Unsupported MIME type"
    });
  });

  it("fails when the direct storage upload fails", async () => {
    apiClientMock.mockResolvedValueOnce({
      headers: {
        "content-type": "image/png"
      },
      id: "media-1",
      method: "PUT",
      uploadUrl: "https://storage.example.com/upload"
    });

    const uploadPromise = uploadMediaAsset({
      file: new File(["hello"], "hero.png", { type: "image/png" })
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest.instances).toHaveLength(1);
    });

    const xhr = MockXMLHttpRequest.instances[0];
    xhr.fail();

    await expect(uploadPromise).rejects.toMatchObject({
      message: "Nao foi possivel enviar o arquivo para o armazenamento."
    });
    expect(apiClientMock).toHaveBeenCalledTimes(1);
  });

  it("propagates failures from the complete step", async () => {
    apiClientMock
      .mockResolvedValueOnce({
        headers: {
          "content-type": "image/png"
        },
        id: "media-1",
        method: "PUT",
        uploadUrl: "https://storage.example.com/upload"
      })
      .mockRejectedValueOnce(
        new ApiError("Media asset not found", 404, "Not Found", [
          "Media asset not found"
        ])
      );

    const uploadPromise = uploadMediaAsset({
      file: new File(["hello"], "hero.png", { type: "image/png" })
    });

    await vi.waitFor(() => {
      expect(MockXMLHttpRequest.instances).toHaveLength(1);
    });

    MockXMLHttpRequest.instances[0].succeed();

    await expect(uploadPromise).rejects.toMatchObject({
      message: "Media asset not found"
    });
  });

  it("aborts the direct upload when the caller cancels", async () => {
    apiClientMock.mockResolvedValueOnce({
      headers: {
        "content-type": "image/png"
      },
      id: "media-1",
      method: "PUT",
      uploadUrl: "https://storage.example.com/upload"
    });

    const abortController = new AbortController();
    const uploadPromise = uploadMediaAsset({
      file: new File(["hello"], "hero.png", { type: "image/png" }),
      signal: abortController.signal
    });

    abortController.abort();

    await expect(uploadPromise).rejects.toSatisfy((error: unknown) =>
      isMediaUploadAbortError(error)
    );
  });
});
