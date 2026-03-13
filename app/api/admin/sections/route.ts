import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sectionCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = sectionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані секції" }, { status: 400 });
  }

  const currentBrief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!currentBrief) {
    return NextResponse.json({ error: "Бриф не знайдено" }, { status: 404 });
  }

  const section = await prisma.$transaction(async (tx) => {
    const existingSections = await tx.briefSection.findMany({
      where: { briefConfigId: currentBrief.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    const targetSortOrder = Math.min(
      Math.max(parsed.data.sortOrder, 1),
      existingSections.length + 1,
    );

    await tx.briefSection.updateMany({
      where: { briefConfigId: currentBrief.id, sortOrder: { gte: targetSortOrder } },
      data: { sortOrder: { increment: 1 } },
    });

    return tx.briefSection.create({
      data: {
        briefConfigId: currentBrief.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        sortOrder: targetSortOrder,
      },
      select: { id: true, title: true, description: true, sortOrder: true },
    });
  });

  return NextResponse.json({ success: true, section }, { status: 201 });
}
