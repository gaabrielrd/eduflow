import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACTIVE_ORGANIZATION_COOKIE_NAME
} from "@/lib/auth/auth-storage";

function hasAccessToken(request: NextRequest) {
  return Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value);
}

function hasActiveOrganization(request: NextRequest) {
  return Boolean(request.cookies.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasAccessToken(request);
  const hasOrganization = hasActiveOrganization(request);

  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!hasOrganization) {
      return NextResponse.redirect(
        new URL("/onboarding/create-organization", request.url)
      );
    }

    return NextResponse.next();
  }

  if (pathname === "/onboarding/create-organization") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (hasOrganization) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (pathname === "/login" || pathname === "/register") {
    if (!isAuthenticated) {
      return NextResponse.next();
    }

    return NextResponse.redirect(
      new URL(
        hasOrganization ? "/app/dashboard" : "/onboarding/create-organization",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register", "/onboarding/create-organization"]
};
