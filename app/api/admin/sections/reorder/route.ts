import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sectionReorderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = sectionReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані сортування секції" }, { status: 400 });
  }

  const { sectionId, direction } = parsed.data;
  const current = await prisma.briefSection.findUnique({
    where: { id: sectionId },
    select: { id: true, briefConfigId: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  const ordered = await prisma.briefSection.findMany({
    where: { briefConfigId: current.briefConfigId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  const currentIndex = ordered.findIndex((section) => section.id === sectionId);
  if (currentIndex === -1) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= ordered.length) {
    return NextResponse.json({ success: true });
  }

  const currentSection = ordered[currentIndex];
  const targetSection = ordered[targetIndex];

  await prisma.$transaction([
    prisma.briefSection.update({
      where: { id: currentSection.id },
      data: { sortOrder: targetSection.sortOrder },
    }),
    prisma.briefSection.update({
      where: { id: targetSection.id },
      data: { sortOrder: currentSection.sortOrder },
    }),
  ]);

  return NextResponse.json({ success: true });
}
