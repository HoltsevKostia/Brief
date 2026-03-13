import { prisma } from "@/lib/prisma";

export async function getCurrentBrief() {
  return prisma.briefConfig.findFirst({
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
