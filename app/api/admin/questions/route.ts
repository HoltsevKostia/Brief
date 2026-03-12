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

  const createData = {
    ...parsed.data,
    briefConfigId: currentBrief.id,
    optionsJson: parsed.data.optionsJson ?? undefined,
  };

  const question = await prisma.briefQuestion.create({
    data: createData,
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

  return NextResponse.json({ success: true, question }, { status: 201 });
}
