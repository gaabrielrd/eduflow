export function formatMediaType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "JPG";
  }

  if (mimeType === "image/png") {
    return "PNG";
  }

  if (mimeType === "image/webp") {
    return "WEBP";
  }

  if (mimeType === "application/pdf") {
    return "PDF";
  }

  return mimeType;
}

export function formatMediaDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
