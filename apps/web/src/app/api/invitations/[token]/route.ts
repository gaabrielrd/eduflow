import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import {
  externalApiRequest,
  getSessionFromAccessToken,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type {
  AcceptInvitationResponse,
  PublicInvitation
} from "@/lib/organizations/organization-members-types";

type InvitationRouteProps = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_: Request, { params }: InvitationRouteProps) {
  const { token } = await params;

  try {
    const invitation = await externalApiRequest<PublicInvitation>({
      method: "GET",
      path: `/invitations/${token}`,
      retryOnUnauthorized: false
    });

    return NextResponse.json(invitation);
  } catch (error) {
    return toApiRouteErrorResponse(error);
  }
}

export async function POST(_: Request, { params }: InvitationRouteProps) {
  const { token } = await params;
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);

  if (!resolution.session || !resolution.tokens) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  try {
    const accepted = await externalApiRequest<AcceptInvitationResponse>({
      accessToken: resolution.tokens.accessToken,
      method: "POST",
      path: `/invitations/${token}/accept`
    });
    const session = await getSessionFromAccessToken(
      resolution.tokens.accessToken,
      accepted.organization.id
    );
    const response = NextResponse.json({
      ...accepted,
      session
    });

    writeAuthCookies(response, resolution.tokens, session.activeOrganizationId);

    return response;
  } catch (error) {
    return toApiRouteErrorResponse(error);
  }
}
