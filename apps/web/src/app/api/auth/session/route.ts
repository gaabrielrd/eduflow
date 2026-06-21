import { NextResponse } from "next/server";

import {
  clearAuthCookies,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";

export async function GET() {
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);
  const response = NextResponse.json({ session: resolution.session });

  if (!resolution.session || !resolution.tokens) {
    clearAuthCookies(response);
    return response;
  }

  if (resolution.didRefresh) {
    writeAuthCookies(
      response,
      resolution.tokens,
      resolution.session.activeOrganizationId
    );
  }

  return response;
}
