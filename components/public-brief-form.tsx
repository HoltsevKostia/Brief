"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type QuestionType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "singleSelect"
  | "multiSelect"
  | "checkbox";

type BriefQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required: boolean;
  placeholder: string | null;
  optionsJson: unknown;
};

type BriefSection = {
  id: string;
  title: string;
  description: string | null;
  questions: BriefQuestion[];
};

type BriefFormProps = {
  briefConfigId: string;
  sections: BriefSection[];
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
    turnstile?: {
      reset: () => void;
    };
  }
}

function parseOptions(optionsJson: unknown): string[] {
  if (!Array.isArray(optionsJson)) return [];
  return optionsJson.filter((item): item is string => typeof item === "string");
}

export function PublicBriefForm({ briefConfigId, sections }: BriefFormProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const allQuestions = useMemo(
    () => sections.flatMap((section) => section.questions),
    [sections],
  );

  const optionsById = useMemo(
    () =>
      new Map(allQuestions.map((question) => [question.id, parseOptions(question.optionsJson)])),
    [allQuestions],
  );

  useEffect(() => {
    if (!turnstileSiteKey) return;

    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
    };

    window.onTurnstileExpired = () => {
      setTurnstileToken(null);
    };

    window.onTurnstileError = () => {
      setTurnstileToken(null);
    };

    return () => {
      window.onTurnstileSuccess = undefined;
      window.onTurnstileExpired = undefined;
      window.onTurnstileError = undefined;
    };
  }, [turnstileSiteKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (turnstileSiteKey && !turnstileToken) {
      setError("Підтвердіть, що ви не робот.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const answers = allQuestions.map((question) => {
      switch (question.type) {
        case "checkbox":
          return {
            questionId: question.id,
            value: formData.get(question.id) === "on",
          };
        case "multiSelect":
          return {
            questionId: question.id,
            value: formData.getAll(question.id).map(String),
          };
        default:
          return {
            questionId: question.id,
            value: String(formData.get(question.id) ?? ""),
          };
      }
    });

    const response = await fetch("/api/public/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        briefConfigId,
        turnstileToken: turnstileToken ?? undefined,
        answers,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Не вдалося надіслати форму");
      if (turnstileSiteKey) {
        window.turnstile?.reset();
        setTurnstileToken(null);
      }
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/submitted";
  }

  function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.tagName === "TEXTAREA") return;
    event.preventDefault();
  }

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={handleFormKeyDown}
      className="space-y-7"
      data-testid="public-brief-form"
    >
      {turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      ) : null}

      {sections.map((section) => (
        <section
          key={section.id}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          data-testid="public-brief-section"
        >
          <header>
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            {section.description ? (
              <p className="mt-1 text-sm text-slate-600">{section.description}</p>
            ) : null}
          </header>

          {section.questions.map((question) => {
            const options = optionsById.get(question.id) ?? [];

            return (
              <div
                key={question.id}
                className="space-y-2.5"
                data-testid="public-question"
                data-question-id={question.id}
                data-question-type={question.type}
                data-required={question.required ? "true" : "false"}
              >
                <label htmlFor={question.id} className="block text-sm font-medium text-slate-900">
                  {question.label} {question.required ? <span className="text-red-600">*</span> : null}
                </label>

                {question.type === "text" && (
                  <input
                    id={question.id}
                    name={question.id}
                    type={question.label.trim().toLowerCase() === "кінцевий дедлайн" ? "date" : "text"}
                    required={question.required}
                    placeholder={question.placeholder ?? ""}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {question.type === "textarea" && (
                  <textarea
                    id={question.id}
                    name={question.id}
                    required={question.required}
                    placeholder={question.placeholder ?? ""}
                    className="min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {question.type === "email" && (
                  <input
                    id={question.id}
                    name={question.id}
                    type="email"
                    required={question.required}
                    placeholder={question.placeholder ?? ""}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {question.type === "number" && (
                  <input
                    id={question.id}
                    name={question.id}
                    type="number"
                    min={0}
                    required={question.required}
                    placeholder={question.placeholder ?? ""}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                )}

                {question.type === "singleSelect" && (
                  <select
                    id={question.id}
                    name={question.id}
                    required={question.required}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Оберіть варіант
                    </option>
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {question.type === "multiSelect" && (
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {options.map((option) => (
                      <label key={option} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          name={question.id}
                          value={option}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "checkbox" && (
                  <label className="flex items-center gap-2.5 text-sm text-slate-700">
                    <input
                      id={question.id}
                      name={question.id}
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Так</span>
                  </label>
                )}
              </div>
            );
          })}
        </section>
      ))}

      {turnstileSiteKey ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div
            className="cf-turnstile"
            data-sitekey={turnstileSiteKey}
            data-callback="onTurnstileSuccess"
            data-expired-callback="onTurnstileExpired"
            data-error-callback="onTurnstileError"
          />
        </div>
      ) : null}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        data-testid="public-submit-button"
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? "Надсилання..." : "Надіслати"}
      </button>
    </form>
  );
}
