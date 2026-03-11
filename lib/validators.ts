import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(2000, "Description is too long"),
});

const questionBaseSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(300, "Label is too long"),
  type: questionTypeSchema,
  required: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0),
  placeholder: z
    .string()
    .trim()
    .max(300, "Placeholder is too long")
    .optional()
    .nullable(),
  optionsJson: z.array(z.string().trim().min(1)).max(100).optional().nullable(),
});

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
      message: "singleSelect and multiSelect questions must include at least one option",
    });
  }
  if (
    needsOptions &&
    value.optionsJson !== undefined &&
    value.optionsJson !== null &&
    value.optionsJson.length === 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "singleSelect and multiSelect questions must include at least one option",
    });
  }
  if (!needsOptions && value.optionsJson && value.optionsJson.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "optionsJson is only allowed for singleSelect and multiSelect",
    });
  }
}

export const questionCreateSchema = questionBaseSchema.superRefine((value, ctx) =>
  validateQuestionOptions(value, ctx, true),
);

export const questionUpdateSchema = questionBaseSchema.partial().superRefine((value, ctx) =>
  validateQuestionOptions(value, ctx, false),
);

export const submissionInputSchema = z.object({
  briefConfigId: z.string().cuid(),
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
        message: "Duplicate questionId is not allowed",
      });
      return;
    }
    seen.add(answer.questionId);
  });
});
