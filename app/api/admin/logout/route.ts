import { NextResponse } from "next/server";
import {
  getClearSessionCookieOptions,
  sessionCookieName,
} from "@/lib/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(sessionCookieName, "", getClearSessionCookieOptions());
  return response;
}
