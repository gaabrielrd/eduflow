import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import { externalApiRequest } from "@/lib/auth/auth-server";
import {
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type { AuthTokens, SessionData } from "@/lib/auth/auth-types";
import type { UpdateModulePayload } from "@/lib/courses/course-types";

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
    moduleId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const { courseId, moduleId } = await context.params;
  const payload = (await request.json()) as UpdateModulePayload;

  try {
    const courseModule = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      body: payload,
      method: "PATCH",
      organizationId: resolution.session.activeOrganizationId,
      path: `/courses/${courseId}/modules/${moduleId}`
    });
    const response = NextResponse.json(courseModule);

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

export async function DELETE(_: Request, context: RouteContext) {
  const resolution = (await resolveAuthenticatedRequest()) as AuthenticatedResolution | null;

  if (!resolution) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const { courseId, moduleId } = await context.params;

  try {
    const courseModule = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      method: "DELETE",
      organizationId: resolution.session.activeOrganizationId,
      path: `/courses/${courseId}/modules/${moduleId}`
    });
    const response = NextResponse.json(courseModule);

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
