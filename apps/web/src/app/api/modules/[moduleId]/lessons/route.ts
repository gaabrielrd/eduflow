import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import { externalApiRequest } from "@/lib/auth/auth-server";
import {
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type { AuthTokens, SessionData } from "@/lib/auth/auth-types";
import type { CreateLessonPayload } from "@/lib/courses/course-types";

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
    moduleId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const { moduleId } = await context.params;
  const payload = (await request.json()) as CreateLessonPayload;

  try {
    const lesson = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      body: payload,
      method: "POST",
      organizationId: resolution.session.activeOrganizationId,
      path: `/modules/${moduleId}/lessons`
    });
    const response = NextResponse.json(lesson);

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
