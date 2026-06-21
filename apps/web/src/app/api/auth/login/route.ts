import { NextResponse } from "next/server";

import { completeLoginSession, writeAuthCookies } from "@/lib/auth/auth-server";
import type { LoginPayload } from "@/lib/auth/auth-types";

export async function POST(request: Request) {
  const payload = (await request.json()) as LoginPayload;
  const { session, tokens } = await completeLoginSession(payload);
  const response = NextResponse.json({ session });

  writeAuthCookies(response, tokens, session.activeOrganizationId);

  return response;
}
