import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessionCookieName, verifySession } from "@/lib/session";

export async function getAdminFromRequest(request?: NextRequest) {
  const sessionToken = request
    ? request.cookies.get(sessionCookieName)?.value
    : (await cookies()).get(sessionCookieName)?.value;

  const session = verifySession(sessionToken);
  if (!session) return null;

  return prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, username: true, createdAt: true, updatedAt: true },
  });
}

export async function requireAdmin(request?: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    throw new Error("Unauthorized");
  }
  return admin;
}
