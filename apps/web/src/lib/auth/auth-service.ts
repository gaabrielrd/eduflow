import { apiClient } from "@/lib/api/api-client";
import type {
  CreateOrganizationPayload,
  LoginPayload,
  RegisterPayload,
  SessionData,
  SessionResponse
} from "@/lib/auth/auth-types";

async function authRouteRequest(
  path: string,
  method: "GET" | "POST",
  body?: CreateOrganizationPayload | LoginPayload | RegisterPayload
) {
  const response = await apiClient<SessionResponse>({
    body,
    method,
    onUnauthorized: async () => {
      try {
        await apiClient<SessionResponse>({
          method: "POST",
          path: "/api/auth/refresh",
          retryOnUnauthorized: false
        });

        return true;
      } catch {
        return false;
      }
    },
    path,
    retryOnUnauthorized: path === "/api/auth/session"
  });

  return response.session;
}

export async function loginUser(payload: LoginPayload) {
  const session = await authRouteRequest("/api/auth/login", "POST", payload);

  if (!session) {
    throw new Error("Nao foi possivel iniciar a sessao");
  }

  return session;
}

export async function registerUser(payload: RegisterPayload) {
  const session = await authRouteRequest("/api/auth/register", "POST", payload);

  if (!session) {
    throw new Error("Nao foi possivel concluir o cadastro");
  }

  return session;
}

export async function getSession() {
  return authRouteRequest("/api/auth/session", "GET");
}

export async function logoutUser() {
  await apiClient<{ success: true }>({
    method: "POST",
    path: "/api/auth/logout",
    retryOnUnauthorized: false
  });
}

export async function createOrganization(payload: CreateOrganizationPayload) {
  const session = await authRouteRequest("/api/auth/organization", "POST", payload);

  if (!session) {
    throw new Error("Nao foi possivel atualizar a sessao");
  }

  return session;
}

export async function setOrganization(organizationId: string) {
  const response = await apiClient<SessionResponse>({
    body: { organizationId },
    method: "PATCH",
    onUnauthorized: async () => {
      try {
        await apiClient<SessionResponse>({
          method: "POST",
          path: "/api/auth/refresh",
          retryOnUnauthorized: false
        });

        return true;
      } catch {
        return false;
      }
    },
    path: "/api/auth/organization"
  });

  return response.session;
}

export function getPostAuthRedirect(session: SessionData) {
  if (!session.activeOrganizationId) {
    return "/onboarding/create-organization";
  }

  return "/app/dashboard";
}
