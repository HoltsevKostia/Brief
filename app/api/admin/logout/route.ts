import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import {
  getClearSessionCookieOptions,
  sessionCookieName,
} from "@/lib/session";

export async function POST(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, "", getClearSessionCookieOptions());
  return response;
}
