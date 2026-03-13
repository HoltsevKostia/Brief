import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { questionCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = questionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані питання" }, { status: 400 });
  }

  const currentBrief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!currentBrief) {
    return NextResponse.json({ error: "Бриф не знайдено" }, { status: 404 });
  }

  const section = await prisma.briefSection.findUnique({
    where: { id: parsed.data.briefSectionId },
    select: { id: true, briefConfigId: true },
  });
  if (!section || section.briefConfigId !== currentBrief.id) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  const question = await prisma.$transaction(async (tx) => {
    const sectionQuestions = await tx.briefQuestion.findMany({
      where: { briefSectionId: section.id },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    const targetSortOrder = Math.min(
      Math.max(parsed.data.sortOrder, 1),
      sectionQuestions.length + 1,
    );

    await tx.briefQuestion.updateMany({
      where: {
        briefSectionId: section.id,
        sortOrder: { gte: targetSortOrder },
      },
      data: {
        sortOrder: { increment: 1 },
      },
    });

    return tx.briefQuestion.create({
      data: {
        briefConfigId: currentBrief.id,
        briefSectionId: parsed.data.briefSectionId,
        label: parsed.data.label,
        type: parsed.data.type,
        required: parsed.data.required,
        sortOrder: targetSortOrder,
        placeholder: parsed.data.placeholder ?? null,
        optionsJson: parsed.data.optionsJson ?? undefined,
      },
      select: {
        id: true,
        briefSectionId: true,
        label: true,
        type: true,
        required: true,
        sortOrder: true,
        placeholder: true,
        optionsJson: true,
      },
    });
  });

  return NextResponse.json({ success: true, question }, { status: 201 });
}
