import { NextResponse } from "next/server";

import {
  createOrganizationFromCookies,
  readAuthCookiesFromStore,
  resolveSessionFromCookies,
  writeActiveOrganizationCookie,
  writeAuthCookies
} from "@/lib/auth/auth-server";
import type { CreateOrganizationPayload } from "@/lib/auth/auth-types";

export async function POST(request: Request) {
  const payload = (await request.json()) as CreateOrganizationPayload;
  const authCookies = await readAuthCookiesFromStore();
  const { session, tokens } = await createOrganizationFromCookies(
    authCookies,
    payload
  );
  const response = NextResponse.json({ session });

  writeAuthCookies(response, tokens, session.activeOrganizationId);

  return response;
}

export async function PATCH(request: Request) {
  const { organizationId } = (await request.json()) as { organizationId: string };
  const authCookies = await readAuthCookiesFromStore();
  const resolution = await resolveSessionFromCookies(authCookies, true);

  if (!resolution.session) {
    return NextResponse.json(
      { message: "Invalid authentication credentials" },
      { status: 401 }
    );
  }

  const nextActiveOrganizationId =
    resolution.session.organizations.find(
      (organization) => organization.id === organizationId
    )?.id ?? resolution.session.activeOrganizationId;

  const response = NextResponse.json({
    session: {
      ...resolution.session,
      activeOrganizationId: nextActiveOrganizationId
    }
  });

  if (resolution.tokens) {
    writeAuthCookies(response, resolution.tokens, nextActiveOrganizationId);
  } else {
    writeActiveOrganizationCookie(response, nextActiveOrganizationId);
  }

  return response;
}
