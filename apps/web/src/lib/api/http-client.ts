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

type RequestOptions = {
  accessToken?: string | null;
  body?: JsonValue;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  organizationId?: string | null;
  path: string;
  signal?: AbortSignal;
};

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl.replace(/\/+$/, "");
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

export async function apiRequest<T>({
  accessToken,
  body,
  method = "GET",
  organizationId,
  path,
  signal
}: RequestOptions): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(organizationId ? { "X-Organization-Id": organizationId } : {})
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
