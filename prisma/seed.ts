import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function getRequiredEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for seeding`);
  }
  return value;
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

  let brief = await prisma.briefConfig.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!brief) {
    brief = await prisma.briefConfig.create({
      data: {
        title: "Project Brief",
        description: "Please fill in the brief below.",
      },
      select: { id: true },
    });
  }

  const questionsCount = await prisma.briefQuestion.count({
    where: { briefConfigId: brief.id },
  });

  if (questionsCount === 0) {
    await prisma.briefQuestion.createMany({
      data: [
        {
          briefConfigId: brief.id,
          label: "Your name",
          type: "text",
          required: true,
          sortOrder: 1,
          placeholder: "John Doe",
        },
        {
          briefConfigId: brief.id,
          label: "Email",
          type: "email",
          required: true,
          sortOrder: 2,
          placeholder: "john@example.com",
        },
        {
          briefConfigId: brief.id,
          label: "Tell us about your project",
          type: "textarea",
          required: true,
          sortOrder: 3,
          placeholder: "Short description...",
        },
        {
          briefConfigId: brief.id,
          label: "Preferred contact channel",
          type: "singleSelect",
          required: true,
          sortOrder: 4,
          optionsJson: ["Instagram", "Telegram", "Friend"],
        },
        {
          briefConfigId: brief.id,
          label: "Services needed",
          type: "multiSelect",
          required: true,
          sortOrder: 5,
          optionsJson: ["Branding", "Website", "SMM", "Ads"],
        },
        {
          briefConfigId: brief.id,
          label: "I agree to be contacted",
          type: "checkbox",
          required: true,
          sortOrder: 6,
        },
      ],
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
