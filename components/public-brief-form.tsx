"use client";

import { useMemo, useState } from "react";

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

type BriefFormProps = {
  briefConfigId: string;
  questions: BriefQuestion[];
};

function parseOptions(optionsJson: unknown): string[] {
  if (!Array.isArray(optionsJson)) return [];
  return optionsJson.filter((item): item is string => typeof item === "string");
}

export function PublicBriefForm({ briefConfigId, questions }: BriefFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsById = useMemo(
    () =>
      new Map(questions.map((question) => [question.id, parseOptions(question.optionsJson)])),
    [questions],
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const answers = questions.map((question) => {
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
        answers,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? "Failed to submit");
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/submitted";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {questions.map((question) => {
        const options = optionsById.get(question.id) ?? [];

        return (
          <div key={question.id} className="space-y-2">
            <label htmlFor={question.id} className="block text-sm font-medium">
              {question.label}
              {question.required ? " *" : ""}
            </label>

            {question.type === "text" && (
              <input
                id={question.id}
                name={question.id}
                type="text"
                required={question.required}
                placeholder={question.placeholder ?? ""}
                className="w-full rounded border px-3 py-2"
              />
            )}

            {question.type === "textarea" && (
              <textarea
                id={question.id}
                name={question.id}
                required={question.required}
                placeholder={question.placeholder ?? ""}
                className="w-full rounded border px-3 py-2"
              />
            )}

            {question.type === "email" && (
              <input
                id={question.id}
                name={question.id}
                type="email"
                required={question.required}
                placeholder={question.placeholder ?? ""}
                className="w-full rounded border px-3 py-2"
              />
            )}

            {question.type === "number" && (
              <input
                id={question.id}
                name={question.id}
                type="number"
                required={question.required}
                placeholder={question.placeholder ?? ""}
                className="w-full rounded border px-3 py-2"
              />
            )}

            {question.type === "singleSelect" && (
              <select
                id={question.id}
                name={question.id}
                required={question.required}
                className="w-full rounded border px-3 py-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Select an option
                </option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {question.type === "multiSelect" && (
              <div className="space-y-2">
                {options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={question.id}
                      value={option}
                      className="h-4 w-4 rounded border"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.type === "checkbox" && (
              <input
                id={question.id}
                name={question.id}
                type="checkbox"
                className="h-4 w-4 rounded border"
              />
            )}
          </div>
        );
      })}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
