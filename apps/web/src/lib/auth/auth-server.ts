import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { ApiError, apiClient, getApiBaseUrl } from "@/lib/api/api-client";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACTIVE_ORGANIZATION_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME
} from "@/lib/auth/auth-storage";
import type {
  AuthResponse,
  AuthTokens,
  CreateOrganizationPayload,
  LoginPayload,
  RegisterPayload,
  SessionData
} from "@/lib/auth/auth-types";

type AuthCookieState = {
  accessToken: string | null;
  activeOrganizationId: string | null;
  refreshToken: string | null;
};

type SessionResolution = {
  didRefresh: boolean;
  session: SessionData | null;
  tokens: AuthTokens | null;
};

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {})
  };
}

export function readAuthCookies(request?: NextRequest): AuthCookieState {
  const cookieStore = request?.cookies;

  return {
    accessToken: cookieStore?.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null,
    activeOrganizationId:
      cookieStore?.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value ?? null,
    refreshToken: cookieStore?.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null
  };
}

export async function readAuthCookiesFromStore(): Promise<AuthCookieState> {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null,
    activeOrganizationId:
      cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null
  };
}

export function writeAuthCookies(
  response: NextResponse,
  tokens: AuthTokens,
  activeOrganizationId: string | null
) {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE_NAME,
    tokens.accessToken,
    getCookieOptions(60 * 60)
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE_NAME,
    tokens.refreshToken,
    getCookieOptions(60 * 60 * 24 * 30)
  );

  if (activeOrganizationId) {
    response.cookies.set(
      ACTIVE_ORGANIZATION_COOKIE_NAME,
      activeOrganizationId,
      getCookieOptions(60 * 60 * 24 * 30)
    );
    return;
  }

  response.cookies.delete(ACTIVE_ORGANIZATION_COOKIE_NAME);
}

export function writeActiveOrganizationCookie(
  response: NextResponse,
  activeOrganizationId: string | null
) {
  if (!activeOrganizationId) {
    response.cookies.delete(ACTIVE_ORGANIZATION_COOKIE_NAME);
    return;
  }

  response.cookies.set(
    ACTIVE_ORGANIZATION_COOKIE_NAME,
    activeOrganizationId,
    getCookieOptions(60 * 60 * 24 * 30)
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
  response.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
  response.cookies.delete(ACTIVE_ORGANIZATION_COOKIE_NAME);
}

async function externalAuthRequest<T>(options: {
  accessToken?: string | null;
  body?: CreateOrganizationPayload | LoginPayload | RegisterPayload | { refreshToken: string };
  method?: "GET" | "POST";
  organizationId?: string | null;
  path: string;
}) {
  return apiClient<T>({
    baseUrl: getApiBaseUrl(),
    body: options.body,
    headers: {
      ...(options.accessToken
        ? { Authorization: `Bearer ${options.accessToken}` }
        : {}),
      ...(options.organizationId
        ? { "X-Organization-Id": options.organizationId }
        : {})
    },
    method: options.method,
    path: options.path,
    retryOnUnauthorized: false
  });
}

async function getSessionFromAccessToken(
  accessToken: string,
  activeOrganizationId: string | null
) {
  return externalAuthRequest<SessionData>({
    accessToken,
    method: "GET",
    organizationId: activeOrganizationId,
    path: "/auth/me"
  });
}

async function refreshAccessTokens(refreshToken: string) {
  return externalAuthRequest<AuthTokens>({
    body: { refreshToken },
    method: "POST",
    path: "/auth/refresh"
  });
}

export async function resolveSessionFromCookies(
  authCookies: AuthCookieState,
  allowRefresh = true
): Promise<SessionResolution> {
  if (!authCookies.accessToken || !authCookies.refreshToken) {
    return {
      didRefresh: false,
      session: null,
      tokens: null
    };
  }

  try {
    const session = await getSessionFromAccessToken(
      authCookies.accessToken,
      authCookies.activeOrganizationId
    );

    return {
      didRefresh: false,
      session,
      tokens: {
        accessToken: authCookies.accessToken,
        refreshToken: authCookies.refreshToken
      }
    };
  } catch (error) {
    if (
      !allowRefresh ||
      !(error instanceof ApiError) ||
      error.statusCode !== 401
    ) {
      return {
        didRefresh: false,
        session: null,
        tokens: null
      };
    }

    try {
      const tokens = await refreshAccessTokens(authCookies.refreshToken);
      const session = await getSessionFromAccessToken(
        tokens.accessToken,
        authCookies.activeOrganizationId
      );

      return {
        didRefresh: true,
        session,
        tokens
      };
    } catch {
      return {
        didRefresh: false,
        session: null,
        tokens: null
      };
    }
  }
}

export async function getInitialServerSession() {
  const authCookies = await readAuthCookiesFromStore();

  if (!authCookies.accessToken) {
    return null;
  }

  try {
    return await getSessionFromAccessToken(
      authCookies.accessToken,
      authCookies.activeOrganizationId
    );
  } catch {
    return null;
  }
}

export async function completeLoginSession(payload: LoginPayload) {
  const authResponse = await externalAuthRequest<AuthResponse>({
    body: payload,
    method: "POST",
    path: "/auth/login"
  });

  const session = await getSessionFromAccessToken(authResponse.accessToken, null);

  return {
    session,
    tokens: {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken
    }
  };
}

export async function completeRegisterSession(payload: RegisterPayload) {
  const authResponse = await externalAuthRequest<AuthResponse>({
    body: payload,
    method: "POST",
    path: "/auth/register"
  });

  const session = await getSessionFromAccessToken(authResponse.accessToken, null);

  return {
    session,
    tokens: {
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken
    }
  };
}

export async function logoutExternalSession(refreshToken: string) {
  await externalAuthRequest<{ success: true }>({
    body: { refreshToken },
    method: "POST",
    path: "/auth/logout"
  });
}

export async function createOrganizationFromCookies(
  authCookies: AuthCookieState,
  payload: CreateOrganizationPayload
) {
  if (!authCookies.accessToken || !authCookies.refreshToken) {
    throw new ApiError("Sua sessao expirou. Entre novamente.", 401, "Unauthorized", [
      "Sua sessao expirou. Entre novamente."
    ]);
  }

  let tokens: AuthTokens = {
    accessToken: authCookies.accessToken,
    refreshToken: authCookies.refreshToken
  };

  const performCreate = async (accessToken: string) =>
    externalAuthRequest<{
      id: string;
      name: string;
      role: string;
      slug: string;
    }>({
      accessToken,
      body: payload,
      method: "POST",
      path: "/organizations"
    });

  try {
    const organization = await performCreate(tokens.accessToken);
    const session = await getSessionFromAccessToken(tokens.accessToken, organization.id);

    return {
      session,
      tokens
    };
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) {
      throw error;
    }

    tokens = await refreshAccessTokens(authCookies.refreshToken);

    const organization = await performCreate(tokens.accessToken);
    const session = await getSessionFromAccessToken(tokens.accessToken, organization.id);

    return {
      session,
      tokens
    };
  }
}
