import { NextResponse } from "next/server";

import { toApiRouteErrorResponse } from "@/lib/api/api-route";
import {
  externalApiRequest,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";

export async function GET() {
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);

  if (!resolution.session || !resolution.tokens) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  try {
    const members = await externalApiRequest({
      accessToken: resolution.tokens.accessToken,
      method: "GET",
      organizationId: resolution.session.activeOrganizationId,
      path: "/organizations/current/members"
    });
    const response = NextResponse.json(members);

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
