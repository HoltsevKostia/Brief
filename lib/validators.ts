import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Логін обов'язковий"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export const questionTypeSchema = z.enum([
  "text",
  "textarea",
  "email",
  "number",
  "singleSelect",
  "multiSelect",
  "checkbox",
]);

export const briefUpdateSchema = z.object({
  title: z.string().trim().min(1, "Заголовок обов'язковий").max(200, "Заголовок занадто довгий"),
  description: z.string().trim().max(2000, "Опис занадто довгий"),
});

export const sectionCreateSchema = z.object({
  title: z.string().trim().min(1, "Назва секції обов'язкова").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  sortOrder: z.number().int().min(1),
});

export const sectionUpdateSchema = sectionCreateSchema.partial();

export const sectionReorderSchema = z.object({
  sectionId: z.string().cuid(),
  direction: z.enum(["up", "down"]),
});

const questionBaseSchema = z.object({
  briefSectionId: z.string().cuid(),
  label: z.string().trim().min(1, "Назва питання обов'язкова").max(300, "Назва питання занадто довга"),
  type: questionTypeSchema,
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(1),
  placeholder: z
    .string()
    .trim()
    .max(300, "Плейсхолдер занадто довгий")
    .optional()
    .nullable(),
  optionsJson: z.array(z.string().trim().min(1, "Варіанти не можуть бути порожніми")).max(100).optional().nullable(),
});

function hasDuplicateOptions(options: string[]) {
  const seen = new Set<string>();
  for (const option of options) {
    const normalized = option.trim().toLowerCase();
    if (seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}

function validateQuestionOptions(
  value: { type?: z.infer<typeof questionTypeSchema>; optionsJson?: string[] | null },
  ctx: z.RefinementCtx,
  requireOptionsForSelect: boolean,
) {
  const needsOptions = value.type === "singleSelect" || value.type === "multiSelect";

  if (needsOptions && requireOptionsForSelect && (!value.optionsJson || value.optionsJson.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "Для цього типу питання потрібен хоча б один варіант",
    });
    return;
  }

  if (needsOptions && value.optionsJson !== undefined && value.optionsJson !== null) {
    if (value.optionsJson.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["optionsJson"],
        message: "Для цього типу питання потрібен хоча б один варіант",
      });
      return;
    }

    if (hasDuplicateOptions(value.optionsJson)) {
      ctx.addIssue({
        code: "custom",
        path: ["optionsJson"],
        message: "Варіанти відповіді не повинні дублюватися",
      });
    }
  }

  if (!needsOptions && value.optionsJson !== undefined && value.optionsJson !== null) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "Варіанти відповіді доступні лише для singleSelect та multiSelect",
    });
  }
}

export const questionCreateSchema = questionBaseSchema.superRefine((value, ctx) =>
  validateQuestionOptions(value, ctx, true),
);

export const questionUpdateSchema = questionBaseSchema.partial().superRefine((value, ctx) =>
  validateQuestionOptions(value, ctx, false),
);

export const questionReorderSchema = z.object({
  questionId: z.cuid(),
  direction: z.enum(["up", "down"]),
});

export const submissionInputSchema = z.object({
  briefConfigId: z.string().cuid(),
  turnstileToken: z.string().min(1).optional(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      value: z.union([z.string(), z.boolean(), z.number(), z.array(z.string())]),
    }),
  ),
}).superRefine((data, ctx) => {
  const seen = new Set<string>();
  data.answers.forEach((answer, index) => {
    if (seen.has(answer.questionId)) {
      ctx.addIssue({
        code: "custom",
        path: ["answers", index, "questionId"],
        message: "Дублікати questionId заборонені",
      });
      return;
    }
    seen.add(answer.questionId);
  });
});
