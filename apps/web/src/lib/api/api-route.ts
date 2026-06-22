import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/api-client";

export function toApiRouteErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        details: error.details,
        error: error.error,
        message: error.message
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: "Unexpected server error"
    },
    { status: 500 }
  );
}
