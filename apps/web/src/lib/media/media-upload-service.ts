import { ApiError, apiClient } from "@/lib/api/api-client";
import type { MediaAsset } from "@/lib/media/media-types";

type PresignedMediaUpload = {
  readonly id: string;
  readonly uploadUrl: string;
  readonly method: "PUT";
  readonly headers: Record<string, string>;
};

type UploadPhase = "presigning" | "uploading" | "completing";

type UploadMediaAssetOptions = {
  readonly file: File;
  readonly onPhaseChange?: (phase: UploadPhase) => void;
  readonly onProgress?: (progress: number) => void;
  readonly signal?: AbortSignal;
};

export class MediaUploadAbortedError extends Error {
  constructor() {
    super("Upload cancelado.");
    this.name = "MediaUploadAbortedError";
  }
}

export function isMediaUploadAbortError(error: unknown) {
  return (
    error instanceof MediaUploadAbortedError ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export async function uploadMediaAsset({
  file,
  onPhaseChange,
  onProgress,
  signal
}: UploadMediaAssetOptions): Promise<MediaAsset> {
  onPhaseChange?.("presigning");

  const presignedUpload = await presignMediaAsset(file, signal);

  onPhaseChange?.("uploading");
  onProgress?.(0);

  await uploadFileToStorage({
    file,
    headers: presignedUpload.headers,
    method: presignedUpload.method,
    onProgress,
    signal,
    uploadUrl: presignedUpload.uploadUrl
  });

  onPhaseChange?.("completing");

  return completeMediaUpload(presignedUpload.id, signal);
}

async function presignMediaAsset(file: File, signal?: AbortSignal) {
  return apiClient<PresignedMediaUpload>({
    body: {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    },
    method: "POST",
    path: "/api/media/presign",
    signal
  });
}

async function completeMediaUpload(mediaId: string, signal?: AbortSignal) {
  return apiClient<MediaAsset>({
    body: {
      mediaId
    },
    method: "POST",
    path: "/api/media/complete",
    signal
  });
}

function rejectIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new MediaUploadAbortedError();
  }
}

function toUploadFailure(error: unknown) {
  if (isMediaUploadAbortError(error)) {
    return error;
  }

  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Nao foi possivel enviar o arquivo.");
}

function uploadFileToStorage(options: {
  file: File;
  headers: Record<string, string>;
  method: string;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  uploadUrl: string;
}) {
  const { file, headers, method, onProgress, signal, uploadUrl } = options;

  rejectIfAborted(signal);

  return new Promise<void>((resolve, reject) => {
    const xhr = new globalThis.XMLHttpRequest();

    const cleanUp = () => {
      signal?.removeEventListener("abort", handleAbort);
    };

    const fail = (error: unknown) => {
      cleanUp();
      reject(toUploadFailure(error));
    };

    const succeed = () => {
      cleanUp();
      resolve();
    };

    const handleAbort = () => {
      xhr.abort();
    };

    xhr.open(method, uploadUrl);

    Object.entries(headers).forEach(([headerName, headerValue]) => {
      xhr.setRequestHeader(headerName, headerValue);
    });

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        succeed();
        return;
      }

      fail(new Error("Nao foi possivel enviar o arquivo para o armazenamento."));
    };

    xhr.onerror = () => {
      fail(new Error("Nao foi possivel enviar o arquivo para o armazenamento."));
    };

    xhr.onabort = () => {
      fail(new MediaUploadAbortedError());
    };

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    });

    signal?.addEventListener("abort", handleAbort, { once: true });

    xhr.send(file);
  });
}
