import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import { externalApiRequest } from "@/lib/auth/auth-server";
import {
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type { AuthTokens, SessionData } from "@/lib/auth/auth-types";

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

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const { courseId } = await context.params;

  try {
    const version = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      method: "POST",
      organizationId: resolution.session.activeOrganizationId,
      path: `/courses/${courseId}/publish`
    });
    const response = NextResponse.json(version);

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
