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
    return NextResponse.json({ error: "Invalid question payload" }, { status: 400 });
  }

  const existing = await prisma.briefQuestion.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const updateData = {
    ...parsed.data,
    optionsJson: parsed.data.optionsJson ?? undefined,
  };

  const question = await prisma.briefQuestion.update({
    where: { id },
    data: updateData,
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
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
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
