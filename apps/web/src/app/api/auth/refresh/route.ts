import { NextResponse } from "next/server";

import {
  clearAuthCookies,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeAuthCookies
} from "@/lib/auth/auth-server";

export async function POST() {
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);

  if (!resolution.session || !resolution.tokens) {
    const response = NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );

    clearAuthCookies(response);

    return response;
  }

  const response = NextResponse.json({ session: resolution.session });

  writeAuthCookies(
    response,
    resolution.tokens,
    resolution.session.activeOrganizationId
  );

  return response;
}
