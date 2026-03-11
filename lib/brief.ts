import { prisma } from "@/lib/prisma";

export async function getCurrentBrief() {
  return prisma.briefConfig.findFirst({
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
