import { apiClient } from "@/lib/api/api-client";
import type {
  AcceptInvitationResponse,
  CreateInvitationPayload,
  OrganizationInvitation,
  OrganizationMember,
  PublicInvitation
} from "@/lib/organizations/organization-members-types";

export async function listCurrentOrganizationMembers() {
  return apiClient<OrganizationMember[]>({
    method: "GET",
    path: "/api/organizations/current/members"
  });
}

export async function listCurrentOrganizationInvitations() {
  return apiClient<OrganizationInvitation[]>({
    method: "GET",
    path: "/api/organizations/current/invitations"
  });
}

export async function createCurrentOrganizationInvitation(
  payload: CreateInvitationPayload
) {
  return apiClient<OrganizationInvitation>({
    body: payload,
    method: "POST",
    path: "/api/organizations/current/invitations"
  });
}

export async function getInvitationByToken(token: string) {
  return apiClient<PublicInvitation>({
    method: "GET",
    path: `/api/invitations/${token}`
  });
}

export async function acceptInvitation(token: string) {
  return apiClient<AcceptInvitationResponse>({
    method: "POST",
    path: `/api/invitations/${token}`
  });
}
