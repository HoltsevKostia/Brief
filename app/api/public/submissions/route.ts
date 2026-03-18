import {
  validateNumericBusinessRules,
  validateTextualBusinessRules,
} from "@/lib/business-validation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { submissionInputSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

type SubmissionQuestionType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "singleSelect"
  | "multiSelect"
  | "checkbox";

type SubmissionQuestion = {
  id: string;
  label: string;
  type: SubmissionQuestionType;
  required: boolean;
  optionsJson: unknown;
};

type RequiredQuestion = {
  id: string;
  type: SubmissionQuestionType;
};

const PUBLIC_SUBMISSION_LIMIT = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

function parseOptions(optionsJson: unknown): string[] {
  if (!Array.isArray(optionsJson)) return [];
  return optionsJson.filter((item): item is string => typeof item === "string");
}

function isEmptyString(value: string) {
  return value.trim().length === 0;
}

function makeValidationError(message: string) {
  return new Error(`VALIDATION:${message}`);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`public-submissions:${ip}`, PUBLIC_SUBMISSION_LIMIT);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Забагато запитів. Спробуйте пізніше." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec),
        },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = submissionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані форми" }, { status: 400 });
  }

  const turnstileOk = await verifyTurnstileToken({
    token: parsed.data.turnstileToken,
    ip,
  });

  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Перевірка безпеки не пройдена. Спробуйте ще раз." },
      { status: 400 },
    );
  }

  const { briefConfigId, answers } = parsed.data;
  const briefExists = await prisma.briefConfig.findUnique({
    where: { id: briefConfigId },
    select: { id: true },
  });
  if (!briefExists) {
    return NextResponse.json({ error: "Бриф не знайдено" }, { status: 400 });
  }

  const questionIds = [...new Set(answers.map((answer) => answer.questionId))];
  if (questionIds.length !== answers.length) {
    return NextResponse.json({ error: "Дубльовані відповіді на питання заборонені" }, { status: 400 });
  }

  const questions = (await prisma.briefQuestion.findMany({
    where: {
      briefConfigId,
      id: { in: questionIds },
    },
    select: {
      id: true,
      label: true,
      type: true,
      required: true,
      optionsJson: true,
    },
  })) as SubmissionQuestion[];

  const questionById = new Map(questions.map((question) => [question.id, question]));
  if (questionById.size !== questionIds.length) {
    return NextResponse.json({ error: "Форма містить невідомі питання" }, { status: 400 });
  }

  let normalizedAnswers: Array<{ questionId: string; value: string }>;
  try {
    normalizedAnswers = answers.map((answer) => {
      const question = questionById.get(answer.questionId);
      if (!question) {
        throw makeValidationError("Форма містить невідомі питання");
      }

      const value = answer.value;
      const options = parseOptions(question.optionsJson);

      switch (question.type) {
        case "text":
        case "textarea":
        case "email": {
          if (typeof value !== "string") throw makeValidationError("Некоректні значення відповідей");

          const textValidation = validateTextualBusinessRules({
            label: question.label,
            value,
            required: question.required,
            type: question.type,
          });
          if (!textValidation.ok) throw makeValidationError(textValidation.message);

          if (question.type === "email" && !isEmptyString(textValidation.value)) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(textValidation.value)) {
              throw makeValidationError("Вкажіть коректний email");
            }
          }

          return { questionId: answer.questionId, value: textValidation.value };
        }
        case "number": {
          const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : null;
          if (raw === null) throw makeValidationError("Некоректні значення відповідей");
          if (question.required && isEmptyString(raw)) throw makeValidationError("Заповніть обов'язкові поля");

          const numericValidation = validateNumericBusinessRules({
            label: question.label,
            value: raw,
          });

          if (!numericValidation.ok) {
            throw makeValidationError(numericValidation.message);
          }

          if (!isEmptyString(numericValidation.value) && Number.isNaN(Number(numericValidation.value))) {
            throw makeValidationError("Поле має містити число");
          }

          if (!isEmptyString(numericValidation.value) && Number(numericValidation.value) < 0) {
            throw makeValidationError("Поле має бути невід'ємним");
          }

          return { questionId: answer.questionId, value: numericValidation.value };
        }
        case "checkbox": {
          if (typeof value !== "boolean") throw makeValidationError("Некоректні значення відповідей");
          return { questionId: answer.questionId, value: value ? "true" : "false" };
        }
        case "singleSelect": {
          if (typeof value !== "string") throw makeValidationError("Некоректні значення відповідей");
          if (question.required && isEmptyString(value)) throw makeValidationError("Заповніть обов'язкові поля");
          if (!isEmptyString(value) && !options.includes(value)) throw makeValidationError("Некоректні значення відповідей");
          return { questionId: answer.questionId, value: value.trim() };
        }
        case "multiSelect": {
          if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
            throw makeValidationError("Некоректні значення відповідей");
          }
          if (question.required && value.length === 0) throw makeValidationError("Заповніть обов'язкові поля");

          const normalized = value.map((item) => item.trim()).filter((item) => item.length > 0);
          if (question.required && normalized.length === 0) throw makeValidationError("Заповніть обов'язкові поля");
          if (normalized.some((selected) => !options.includes(selected))) {
            throw makeValidationError("Некоректні значення відповідей");
          }
          return { questionId: answer.questionId, value: JSON.stringify(normalized) };
        }
        default:
          throw makeValidationError("Некоректні значення відповідей");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("VALIDATION:")) {
      return NextResponse.json({ error: error.message.replace("VALIDATION:", "") }, { status: 400 });
    }
    return NextResponse.json({ error: "Некоректні значення відповідей" }, { status: 400 });
  }

  const requiredQuestions = (await prisma.briefQuestion.findMany({
    where: { briefConfigId, required: true },
    select: { id: true, type: true },
  })) as RequiredQuestion[];

  const normalizedByQuestionId = new Map(
    normalizedAnswers.map((answer) => [answer.questionId, answer.value]),
  );

  for (const requiredQuestion of requiredQuestions) {
    const submittedValue = normalizedByQuestionId.get(requiredQuestion.id);
    if (submittedValue === undefined) {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
    }
    if (requiredQuestion.type !== "checkbox" && submittedValue.trim().length === 0) {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
    }
    if (requiredQuestion.type === "checkbox" && submittedValue !== "true") {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
    }
    if (requiredQuestion.type === "multiSelect") {
      try {
        const parsedValue = JSON.parse(submittedValue) as unknown;
        if (!Array.isArray(parsedValue) || parsedValue.length === 0) {
          return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
      }
    }
  }

  const submission = await prisma.submission.create({
    data: {
      briefConfigId,
      answers: {
        create: normalizedAnswers,
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
}
