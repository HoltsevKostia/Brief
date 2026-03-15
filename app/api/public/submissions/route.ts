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

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
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
        throw new Error("QUESTION_NOT_FOUND");
      }

      const value = answer.value;
      const options = parseOptions(question.optionsJson);

      switch (question.type) {
        case "text":
        case "textarea":
        case "email": {
          if (typeof value !== "string") throw new Error("INVALID_VALUE_TYPE");
          if (question.required && isEmptyString(value)) throw new Error("REQUIRED_VALUE_MISSING");
          if (
            question.type === "text" &&
            question.label.trim().toLowerCase() === "кінцевий дедлайн" &&
            !isEmptyString(value) &&
            !isValidIsoDate(value.trim())
          ) {
            throw new Error("INVALID_DATE");
          }
          if (question.type === "email" && !isEmptyString(value)) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.trim())) throw new Error("INVALID_EMAIL");
          }
          return { questionId: answer.questionId, value: value.trim() };
        }
        case "number": {
          const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value : null;
          if (raw === null) throw new Error("INVALID_VALUE_TYPE");
          if (question.required && isEmptyString(raw)) throw new Error("REQUIRED_VALUE_MISSING");
          if (!isEmptyString(raw) && Number.isNaN(Number(raw))) throw new Error("INVALID_NUMBER");
          if (!isEmptyString(raw) && Number(raw) < 0) throw new Error("INVALID_NUMBER");
          return { questionId: answer.questionId, value: raw.trim() };
        }
        case "checkbox": {
          if (typeof value !== "boolean") throw new Error("INVALID_VALUE_TYPE");
          return { questionId: answer.questionId, value: value ? "true" : "false" };
        }
        case "singleSelect": {
          if (typeof value !== "string") throw new Error("INVALID_VALUE_TYPE");
          if (question.required && isEmptyString(value)) throw new Error("REQUIRED_VALUE_MISSING");
          if (!isEmptyString(value) && !options.includes(value)) throw new Error("INVALID_OPTION");
          return { questionId: answer.questionId, value };
        }
        case "multiSelect": {
          if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
            throw new Error("INVALID_VALUE_TYPE");
          }
          if (question.required && value.length === 0) throw new Error("REQUIRED_VALUE_MISSING");
          if (value.some((selected) => !options.includes(selected))) throw new Error("INVALID_OPTION");
          return { questionId: answer.questionId, value: JSON.stringify(value) };
        }
        default:
          throw new Error("INVALID_QUESTION_TYPE");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUIRED_VALUE_MISSING") {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
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
