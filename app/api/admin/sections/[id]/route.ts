import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sectionUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = sectionUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані секції" }, { status: 400 });
  }

  const existing = await prisma.briefSection.findUnique({
    where: { id },
    select: { id: true, briefConfigId: true, sortOrder: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  let section:
    | { id: string; title: string; description: string | null; sortOrder: number }
    | null = null;

  const requestedSortOrder = parsed.data.sortOrder;
  if (requestedSortOrder === undefined) {
    section = await prisma.briefSection.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description ?? undefined,
      },
      select: { id: true, title: true, description: true, sortOrder: true },
    });
  } else {
    section = await prisma.$transaction(async (tx) => {
      const ordered = await tx.briefSection.findMany({
        where: { briefConfigId: existing.briefConfigId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });

      const idsWithoutCurrent = ordered.map((s) => s.id).filter((sectionId) => sectionId !== id);
      const targetIndex = Math.min(Math.max(requestedSortOrder - 1, 0), idsWithoutCurrent.length);
      idsWithoutCurrent.splice(targetIndex, 0, id);

      for (let index = 0; index < idsWithoutCurrent.length; index += 1) {
        const sectionId = idsWithoutCurrent[index];
        await tx.briefSection.update({
          where: { id: sectionId },
          data:
            sectionId === id
              ? {
                  title: parsed.data.title,
                  description: parsed.data.description ?? undefined,
                  sortOrder: index + 1,
                }
              : { sortOrder: index + 1 },
        });
      }

      return tx.briefSection.findUnique({
        where: { id },
        select: { id: true, title: true, description: true, sortOrder: true },
      });
    });
  }

  if (!section) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ success: true, section });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await params;
  const existing = await prisma.briefSection.findUnique({
    where: { id },
    select: { id: true, briefConfigId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Секцію не знайдено" }, { status: 404 });
  }

  const answerCount = await prisma.answer.count({
    where: { question: { briefSectionId: id } },
  });
  if (answerCount > 0) {
    return NextResponse.json(
      { error: "Секцію з відповідями не можна видалити" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.briefSection.delete({ where: { id } });

    const remaining = await tx.briefSection.findMany({
      where: { briefConfigId: existing.briefConfigId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });

    for (let index = 0; index < remaining.length; index += 1) {
      await tx.briefSection.update({
        where: { id: remaining[index].id },
        data: { sortOrder: index + 1 },
      });
    }
  });

  return NextResponse.json({ success: true });
}
