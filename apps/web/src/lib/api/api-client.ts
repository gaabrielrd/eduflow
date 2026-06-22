export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly error: string,
    readonly details: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type ApiClientOptions = {
  baseUrl?: string;
  body?: JsonValue;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  onUnauthorized?: () => Promise<boolean> | boolean;
  path: string;
  retryOnUnauthorized?: boolean;
  signal?: AbortSignal;
};

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveBaseUrl(baseUrl?: string) {
  if (!baseUrl) {
    return "";
  }

  return trimTrailingSlashes(baseUrl);
}

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
}

function toErrorMessage(payload: unknown, statusCode: number) {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    Array.isArray(payload.message)
  ) {
    return payload.message.filter((item): item is string => typeof item === "string");
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return [payload.message];
  }

  return [`Request failed with status ${statusCode}`];
}

async function executeRequest<T>({
  baseUrl,
  body,
  headers,
  method = "GET",
  path,
  signal
}: Omit<ApiClientOptions, "onUnauthorized" | "retryOnUnauthorized">): Promise<T> {
  const response = await fetch(joinUrl(resolveBaseUrl(baseUrl), path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const payload = (await response
    .json()
    .catch(() => null)) as Record<string, unknown> | null;

  if (!response.ok) {
    const details = toErrorMessage(payload, response.status);
    const error =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Request failed";

    throw new ApiError(details[0] ?? "Request failed", response.status, error, details);
  }

  return payload as T;
}

export async function apiClient<T>({
  onUnauthorized,
  retryOnUnauthorized = true,
  ...options
}: ApiClientOptions): Promise<T> {
  try {
    return await executeRequest<T>(options);
  } catch (error) {
    if (
      !retryOnUnauthorized ||
      !(error instanceof ApiError) ||
      error.statusCode !== 401 ||
      !onUnauthorized
    ) {
      throw error;
    }

    const didRecover = await onUnauthorized();

    if (!didRecover) {
      throw error;
    }

    return executeRequest<T>(options);
  }
}

function normalizeApiUrl(apiUrl: string) {
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(apiUrl)) {
    return apiUrl;
  }

  return `http://${apiUrl}`;
}

export function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return trimTrailingSlashes(normalizeApiUrl(apiUrl));
}
