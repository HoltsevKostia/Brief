import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "brief_admin_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  adminId: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function createSessionToken(adminId: string) {
  const payload: SessionPayload = {
    adminId,
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  const expires = new Date(payload.exp);
  return {
    token,
    expires,
  };
}

export function getSessionCookieOptions(expires: Date) {
  return {
    ...getBaseCookieOptions(),
    expires,
  };
}

export function getClearSessionCookieOptions() {
  return getSessionCookieOptions(new Date(0));
}

export function verifySession(rawCookieValue?: string | null): SessionPayload | null {
  if (!rawCookieValue) return null;
  const parts = rawCookieValue.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expectedSignature = sign(encodedPayload);
  if (!timingSafeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.adminId || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE_NAME;
