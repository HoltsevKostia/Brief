import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { briefUpdateSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = briefUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані брифу" }, { status: 400 });
  }

  const currentBrief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!currentBrief) {
    return NextResponse.json({ error: "Бриф не знайдено" }, { status: 404 });
  }

  const updated = await prisma.briefConfig.update({
    where: { id: currentBrief.id },
    data: parsed.data,
    select: { id: true, title: true, description: true, updatedAt: true },
  });

  return NextResponse.json({ success: true, brief: updated });
}
