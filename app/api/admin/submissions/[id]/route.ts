import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const auth = requireAdminApi(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { id } = await params;

  try {
    await prisma.submission.delete({
      where: { id },
    });
  } catch {
    return NextResponse.json({ error: "Заявку не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

