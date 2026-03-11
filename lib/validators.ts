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

export const questionCreateSchema = questionBaseSchema.superRefine((value, ctx) => {
  if (value.type === "singleSelect" && (!value.optionsJson || value.optionsJson.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "singleSelect questions must include at least one option",
    });
  }
  if (value.type !== "singleSelect" && value.optionsJson && value.optionsJson.length > 0) {
    ctx.addIssue({
      code: "custom",
      path: ["optionsJson"],
      message: "optionsJson is only allowed for singleSelect",
    });
  }
});

export const questionUpdateSchema = questionCreateSchema.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
});

export const submissionInputSchema = z.object({
  briefConfigId: z.string().cuid(),
  answers: z.array(
    z.object({
      questionId: z.string().cuid(),
      value: z.union([z.string(), z.boolean(), z.number()]),
    }),
  ),
});
