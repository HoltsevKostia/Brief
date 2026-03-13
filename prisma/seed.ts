import { PrismaClient, QuestionType } from "@prisma/client";
import { hash } from "bcryptjs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

type BriefSeedQuestion = {
  label: string;
  type: QuestionType;
  required: boolean;
  sortOrder: number;
  placeholder: string | null;
  optionsJson: string[] | null;
};

type BriefSeedSection = {
  title: string;
  description: string | null;
  sortOrder: number;
  questions: BriefSeedQuestion[];
};

type BriefSeedData = {
  title: string;
  description: string;
  sections: BriefSeedSection[];
};

function getRequiredEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }
  return value;
}

function parseQuestionType(value: string): QuestionType {
  const allowed: QuestionType[] = [
    "text",
    "textarea",
    "email",
    "number",
    "singleSelect",
    "multiSelect",
    "checkbox",
  ];

  if (!allowed.includes(value as QuestionType)) {
    throw new Error(`Unsupported question type in brief-export.json: ${value}`);
  }

  return value as QuestionType;
}

async function loadBriefSeedData(): Promise<BriefSeedData> {
  const sourcePath = path.join(process.cwd(), "prisma", "brief-export.json");
  const raw = await readFile(sourcePath, "utf8");
  const parsed = JSON.parse(raw) as {
    title: string;
    description: string;
    sections: Array<{
      title: string;
      description: string | null;
      sortOrder: number;
      questions: Array<{
        label: string;
        type: string;
        required: boolean;
        sortOrder: number;
        placeholder: string | null;
        optionsJson: unknown;
      }>;
    }>;
  };

  return {
    title: parsed.title,
    description: parsed.description,
    sections: parsed.sections.map((section) => ({
      title: section.title,
      description: section.description ?? null,
      sortOrder: section.sortOrder,
      questions: section.questions.map((question) => ({
        label: question.label,
        type: parseQuestionType(question.type),
        required: question.required,
        sortOrder: question.sortOrder,
        placeholder: question.placeholder ?? null,
        optionsJson: Array.isArray(question.optionsJson)
          ? question.optionsJson.filter((item): item is string => typeof item === "string")
          : null,
      })),
    })),
  };
}

async function main() {
  const username = getRequiredEnv("ADMIN_USERNAME");
  const password = getRequiredEnv("ADMIN_PASSWORD");
  const passwordHash = await hash(password, 12);

  await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  const briefSeed = await loadBriefSeedData();

  let brief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!brief) {
    brief = await prisma.briefConfig.create({
      data: {
        title: briefSeed.title,
        description: briefSeed.description,
      },
      select: { id: true },
    });
  } else {
    await prisma.briefConfig.update({
      where: { id: brief.id },
      data: {
        title: briefSeed.title,
        description: briefSeed.description,
      },
    });
  }

  await prisma.briefQuestion.deleteMany({
    where: { briefConfigId: brief.id },
  });

  await prisma.briefSection.deleteMany({
    where: { briefConfigId: brief.id },
  });

  for (const section of briefSeed.sections.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const createdSection = await prisma.briefSection.create({
      data: {
        briefConfigId: brief.id,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
      },
      select: { id: true },
    });

    await prisma.briefQuestion.createMany({
      data: section.questions
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((question) => {
          const row = {
            briefConfigId: brief.id,
            briefSectionId: createdSection.id,
            label: question.label,
            type: question.type,
            required: question.required,
            sortOrder: question.sortOrder,
            placeholder: question.placeholder,
          };

          if (question.optionsJson !== null) {
            return { ...row, optionsJson: question.optionsJson };
          }

          return row;
        }),
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
