import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { questionUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = questionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Некоректні дані питання";
    return NextResponse.json({ error: firstMessage }, { status: 400 });
  }

  const existing = await prisma.briefQuestion.findUnique({
    where: { id },
    select: { id: true, briefConfigId: true, briefSectionId: true, sortOrder: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Питання не знайдено" }, { status: 404 });
  }

  const nextSectionId = parsed.data.briefSectionId ?? existing.briefSectionId;
  const section = await prisma.briefSection.findUnique({
    where: { id: nextSectionId },
    select: { id: true, briefConfigId: true },
  });
  if (!section || section.briefConfigId !== existing.briefConfigId) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  const question = await prisma.$transaction(async (tx) => {
    const baseUpdateData = {
      label: parsed.data.label,
      type: parsed.data.type,
      required: parsed.data.required,
      placeholder: parsed.data.placeholder ?? undefined,
      optionsJson: parsed.data.optionsJson ?? undefined,
    };

    if (nextSectionId === existing.briefSectionId) {
      const ordered = await tx.briefQuestion.findMany({
        where: { briefSectionId: existing.briefSectionId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });

      const idsWithoutCurrent = ordered.map((q) => q.id).filter((qId) => qId !== id);
      const requestedSortOrder = parsed.data.sortOrder ?? existing.sortOrder;
      const targetIndex = Math.min(
        Math.max(requestedSortOrder - 1, 0),
        idsWithoutCurrent.length,
      );
      idsWithoutCurrent.splice(targetIndex, 0, id);

      for (let index = 0; index < idsWithoutCurrent.length; index += 1) {
        const questionId = idsWithoutCurrent[index];
        await tx.briefQuestion.update({
          where: { id: questionId },
          data:
            questionId === id
              ? {
                  ...baseUpdateData,
                  briefSectionId: nextSectionId,
                  sortOrder: index + 1,
                }
              : { sortOrder: index + 1 },
        });
      }
    } else {
      const oldSectionQuestions = await tx.briefQuestion.findMany({
        where: { briefSectionId: existing.briefSectionId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      const oldIds = oldSectionQuestions.map((q) => q.id).filter((qId) => qId !== id);
      for (let index = 0; index < oldIds.length; index += 1) {
        await tx.briefQuestion.update({
          where: { id: oldIds[index] },
          data: { sortOrder: index + 1 },
        });
      }

      const newSectionQuestions = await tx.briefQuestion.findMany({
        where: { briefSectionId: nextSectionId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      const newIds = newSectionQuestions.map((q) => q.id);
      const requestedSortOrder = parsed.data.sortOrder ?? newIds.length + 1;
      const targetIndex = Math.min(Math.max(requestedSortOrder - 1, 0), newIds.length);
      newIds.splice(targetIndex, 0, id);

      for (let index = 0; index < newIds.length; index += 1) {
        const questionId = newIds[index];
        await tx.briefQuestion.update({
          where: { id: questionId },
          data:
            questionId === id
              ? {
                  ...baseUpdateData,
                  briefSectionId: nextSectionId,
                  sortOrder: index + 1,
                }
              : { sortOrder: index + 1 },
        });
      }
    }

    return tx.briefQuestion.findUnique({
      where: { id },
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

  if (!question) {
    return NextResponse.json({ error: "Питання не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ success: true, question });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await params;
  const existing = await prisma.briefQuestion.findUnique({
    where: { id },
    select: { id: true, briefSectionId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Питання не знайдено" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.briefQuestion.delete({
      where: { id: existing.id },
    });

    const remaining = await tx.briefQuestion.findMany({
      where: { briefSectionId: existing.briefSectionId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await tx.briefQuestion.update({
        where: { id: remaining[index].id },
        data: { sortOrder: index + 1 },
      });
    }
  });

  return NextResponse.json({ success: true });
}
