import { NextResponse } from "next/server";

import {
  clearAuthCookies,
  logoutExternalSession,
  readAuthCookiesFromStore
} from "@/lib/auth/auth-server";

export async function POST() {
  const authCookies = await readAuthCookiesFromStore();

  if (authCookies.refreshToken) {
    await logoutExternalSession(authCookies.refreshToken).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true });

  clearAuthCookies(response);

  return response;
}
