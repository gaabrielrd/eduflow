import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import {
  externalApiRequest,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type { AuthTokens, SessionData } from "@/lib/auth/auth-types";
import type { CreateInvitationPayload } from "@/lib/organizations/organization-members-types";

async function resolveAuthenticatedRequest() {
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);

  if (!resolution.session || !resolution.tokens) {
    return null;
  }

  return resolution;
}

type AuthenticatedResolution = {
  didRefresh: boolean;
  session: SessionData;
  tokens: AuthTokens;
};

export async function GET() {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  try {
    const invitations = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      method: "GET",
      organizationId: resolution.session.activeOrganizationId,
      path: "/organizations/current/invitations"
    });
    const response = NextResponse.json(invitations);

    if (resolution.didRefresh) {
      writeAuthCookies(
        response,
        resolution.tokens,
        resolution.session.activeOrganizationId
      );
    }

    return response;
  } catch (error) {
    return toApiRouteErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const payload = (await request.json()) as CreateInvitationPayload;

  try {
    const invitation = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      body: payload,
      method: "POST",
      organizationId: resolution.session.activeOrganizationId,
      path: "/organizations/current/invitations"
    });
    const response = NextResponse.json(invitation);

    if (resolution.didRefresh) {
      writeAuthCookies(
        response,
        resolution.tokens,
        resolution.session.activeOrganizationId
      );
    }

    return response;
  } catch (error) {
    return toApiRouteErrorResponse(error);
  }
}
