import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  createSessionToken,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/session";
import { loginSchema } from "@/lib/validators";

const ADMIN_LOGIN_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
};

export async function POST(request: Request) {
  const existingSession = getAdminSessionFromRequest(request);
  if (existingSession) {
    return NextResponse.json({ success: true });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin-login:${ip}`, ADMIN_LOGIN_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Забагато спроб входу. Спробуйте пізніше." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  const { username, password } = parsed.data;

  const admin = await prisma.admin.findUnique({
    where: { username },
  });

  if (!admin) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  const isValidPassword = await compare(password, admin.passwordHash);
  if (!isValidPassword) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  const { token, expires } = createSessionToken(admin.id);
  const response = NextResponse.json({ success: true });

  response.cookies.set(
    sessionCookieName,
    token,
    getSessionCookieOptions(expires),
  );

  return response;
}
