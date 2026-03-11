import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySession, type SessionPayload } from "@/lib/session";

function getCookieFromHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function getCookieFromRequest(request: Request | NextRequest, name: string): string | null {
  if ("cookies" in request && request.cookies?.get) {
    return request.cookies.get(name)?.value ?? null;
  }
  return getCookieFromHeader(request.headers.get("cookie"), name);
}

export function getAdminSessionFromRequest(
  request: Request | NextRequest,
): SessionPayload | null {
  const sessionToken = getCookieFromRequest(request, sessionCookieName);
  return verifySession(sessionToken);
}

export function requireAdminApi(request: Request): SessionPayload | NextResponse {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function getAdminSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  return verifySession(sessionToken);
}

export async function requireAdminPage(): Promise<SessionPayload> {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
