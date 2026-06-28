import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import {
  externalApiRequest,
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
    enrollmentId: string;
    lessonId: string;
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

  const { enrollmentId, lessonId } = await context.params;

  try {
    const progress = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      method: "POST",
      organizationId: resolution.session.activeOrganizationId,
      path: `/learning/enrollments/${enrollmentId}/lessons/${lessonId}/start`
    });
    const response = NextResponse.json(progress);

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
