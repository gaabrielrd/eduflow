import { apiRequest } from "@/lib/api/http-client";
import type {
  AuthResponse,
  OrganizationSummary,
  SessionSnapshot
} from "@/lib/auth/auth-types";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = LoginPayload & {
  name: string;
};

type CreateOrganizationPayload = {
  name: string;
  slug: string;
};

export async function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>({
    method: "POST",
    path: "/auth/login",
    body: payload
  });
}

export async function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>({
    method: "POST",
    path: "/auth/register",
    body: payload
  });
}

export async function listOrganizations(accessToken: string) {
  return apiRequest<OrganizationSummary[]>({
    accessToken,
    method: "GET",
    path: "/organizations"
  });
}

export async function createOrganization(
  session: SessionSnapshot,
  payload: CreateOrganizationPayload
) {
  return apiRequest<OrganizationSummary>({
    accessToken: session.accessToken,
    method: "POST",
    path: "/organizations",
    body: payload
  });
}
