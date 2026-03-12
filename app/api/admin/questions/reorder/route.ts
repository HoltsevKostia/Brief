import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { questionReorderSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = questionReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
  }

  const { questionId, direction } = parsed.data;
  const current = await prisma.briefQuestion.findUnique({
    where: { id: questionId },
    select: { id: true, briefConfigId: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const ordered = await prisma.briefQuestion.findMany({
    where: { briefConfigId: current.briefConfigId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });

  const currentIndex = ordered.findIndex((q) => q.id === questionId);
  if (currentIndex === -1) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= ordered.length) {
    return NextResponse.json({ success: true });
  }

  const currentItem = ordered[currentIndex];
  const targetItem = ordered[targetIndex];

  await prisma.$transaction([
    prisma.briefQuestion.update({
      where: { id: currentItem.id },
      data: { sortOrder: targetItem.sortOrder },
    }),
    prisma.briefQuestion.update({
      where: { id: targetItem.id },
      data: { sortOrder: currentItem.sortOrder },
    }),
  ]);

  return NextResponse.json({ success: true });
}
