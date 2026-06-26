const MB = 1024 * 1024;

export const DEFAULT_MEDIA_UPLOAD_MAX_SIZE_BYTES = 10 * MB;

export const DEFAULT_MEDIA_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
] as const;

const MIME_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP"
};

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= MB) {
    return `${(sizeBytes / MB).toFixed(sizeBytes % MB === 0 ? 0 : 1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${sizeBytes} B`;
}

export function formatAcceptedMimeTypes(mimeTypes: readonly string[]) {
  return mimeTypes.map((mimeType) => MIME_TYPE_LABELS[mimeType] ?? mimeType).join(", ");
}

export function validateMediaFile(options: {
  acceptedMimeTypes: readonly string[];
  file: File;
  maxSizeBytes: number;
}) {
  const { acceptedMimeTypes, file, maxSizeBytes } = options;

  if (!acceptedMimeTypes.includes(file.type)) {
    return `Formato nao suportado. Use ${formatAcceptedMimeTypes(acceptedMimeTypes)}.`;
  }

  if (file.size <= 0 || file.size > maxSizeBytes) {
    return `O arquivo precisa ter ate ${formatFileSize(maxSizeBytes)}.`;
  }

  return null;
}
