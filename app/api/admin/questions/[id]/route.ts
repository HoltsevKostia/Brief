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
    return NextResponse.json({ error: "Некоректні дані питання" }, { status: 400 });
  }

  const existing = await prisma.briefQuestion.findUnique({
    where: { id },
    select: { id: true, briefConfigId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Питання не знайдено" }, { status: 404 });
  }

  const baseUpdateData = {
    ...parsed.data,
    optionsJson: parsed.data.optionsJson ?? undefined,
  };

  let question:
    | {
        id: string;
        label: string;
        type: string;
        required: boolean;
        sortOrder: number;
        placeholder: string | null;
        optionsJson: unknown;
      }
    | null = null;

  const requestedSortOrder = parsed.data.sortOrder;

  if (requestedSortOrder === undefined) {
    question = await prisma.briefQuestion.update({
      where: { id },
      data: baseUpdateData,
      select: {
        id: true,
        label: true,
        type: true,
        required: true,
        sortOrder: true,
        placeholder: true,
        optionsJson: true,
      },
    });
  } else {
    question = await prisma.$transaction(async (tx) => {
      const ordered = await tx.briefQuestion.findMany({
        where: { briefConfigId: existing.briefConfigId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });

      const idsWithoutCurrent = ordered
        .map((item) => item.id)
        .filter((questionId) => questionId !== id);

      const targetIndex = Math.min(
        Math.max(requestedSortOrder - 1, 0),
        idsWithoutCurrent.length,
      );

      idsWithoutCurrent.splice(targetIndex, 0, id);

      for (let index = 0; index < idsWithoutCurrent.length; index += 1) {
        const questionId = idsWithoutCurrent[index];
        const nextSortOrder = index + 1;

        await tx.briefQuestion.update({
          where: { id: questionId },
          data:
            questionId === id
              ? {
                  ...baseUpdateData,
                  sortOrder: nextSortOrder,
                }
              : {
                  sortOrder: nextSortOrder,
                },
        });
      }

      return tx.briefQuestion.findUnique({
        where: { id },
        select: {
          id: true,
          label: true,
          type: true,
          required: true,
          sortOrder: true,
          placeholder: true,
          optionsJson: true,
        },
      });
    });
  }

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
    select: { id: true, briefConfigId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Питання не знайдено" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.briefQuestion.delete({
      where: { id: existing.id },
    });

    const remaining = await tx.briefQuestion.findMany({
      where: { briefConfigId: existing.briefConfigId },
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
