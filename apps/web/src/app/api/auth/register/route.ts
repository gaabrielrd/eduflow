import { NextResponse } from "next/server";

import { completeRegisterSession, writeAuthCookies } from "@/lib/auth/auth-server";
import type { RegisterPayload } from "@/lib/auth/auth-types";

export async function POST(request: Request) {
  const payload = (await request.json()) as RegisterPayload;
  const { session, tokens } = await completeRegisterSession(payload);
  const response = NextResponse.json({ session });

  writeAuthCookies(response, tokens, session.activeOrganizationId);

  return response;
}
