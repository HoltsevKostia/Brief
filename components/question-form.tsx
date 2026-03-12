"use client";

import { useEffect, useMemo, useState } from "react";

export type AdminQuestionType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "singleSelect"
  | "multiSelect"
  | "checkbox";

export type AdminQuestion = {
  id: string;
  label: string;
  type: AdminQuestionType;
  required: boolean;
  sortOrder: number;
  placeholder: string | null;
  optionsJson: unknown;
};

type QuestionFormProps = {
  mode: "create" | "edit";
  initial?: AdminQuestion;
  nextSortOrder?: number;
  onCancel?: () => void;
  onSubmit: (payload: {
    label: string;
    type: AdminQuestionType;
    required: boolean;
    sortOrder: number;
    placeholder: string | null;
    optionsJson: string[] | null;
  }) => Promise<void>;
};

const QUESTION_TYPES: AdminQuestionType[] = [
  "text",
  "textarea",
  "email",
  "number",
  "singleSelect",
  "multiSelect",
  "checkbox",
];

function parseOptionsInput(input: string): string[] {
  return input
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function optionsToInput(optionsJson: unknown): string {
  if (!Array.isArray(optionsJson)) return "";
  const options = optionsJson.filter((item): item is string => typeof item === "string");
  return options.join(", ");
}

export function QuestionForm({
  mode,
  initial,
  nextSortOrder = 1,
  onCancel,
  onSubmit,
}: QuestionFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<AdminQuestionType>(initial?.type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? nextSortOrder);
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "");
  const [optionsInput, setOptionsInput] = useState(optionsToInput(initial?.optionsJson));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setLabel(initial.label);
      setType(initial.type);
      setRequired(initial.required);
      setSortOrder(initial.sortOrder);
      setPlaceholder(initial.placeholder ?? "");
      setOptionsInput(optionsToInput(initial.optionsJson));
      setError(null);
    }
  }, [initial]);

  const usesPlaceholder = useMemo(
    () => type === "text" || type === "textarea" || type === "email" || type === "number",
    [type],
  );
  const usesOptions = useMemo(
    () => type === "singleSelect" || type === "multiSelect",
    [type],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const options = usesOptions ? parseOptionsInput(optionsInput) : [];

    try {
      await onSubmit({
        label: label.trim(),
        type,
        required,
        sortOrder,
        placeholder: usesPlaceholder ? (placeholder.trim() || null) : null,
        optionsJson: usesOptions ? options : null,
      });

      if (mode === "create") {
        setLabel("");
        setType("text");
        setRequired(false);
        setSortOrder(nextSortOrder);
        setPlaceholder("");
        setOptionsInput("");
      }
    } catch {
      setError("Failed to save question");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border p-4">
      <h3 className="text-sm font-semibold">
        {mode === "create" ? "Add question" : "Edit question"}
      </h3>

      <div className="space-y-1">
        <label className="text-sm font-medium">Label</label>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AdminQuestionType)}
            className="w-full rounded border px-3 py-2"
          >
            {QUESTION_TYPES.map((questionType) => (
              <option key={questionType} value={questionType}>
                {questionType}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value))}
            className="w-full rounded border px-3 py-2"
            min={1}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
          className="h-4 w-4 rounded border"
        />
        Required
      </label>

      <div className="space-y-1">
        <label className="text-sm font-medium">Placeholder</label>
        <input
          value={placeholder}
          onChange={(event) => setPlaceholder(event.target.value)}
          className="w-full rounded border px-3 py-2"
          disabled={!usesPlaceholder}
          placeholder={usesPlaceholder ? "Optional placeholder" : "Not used for this type"}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Options (comma separated)</label>
        <input
          value={optionsInput}
          onChange={(event) => setOptionsInput(event.target.value)}
          className="w-full rounded border px-3 py-2"
          disabled={!usesOptions}
          placeholder={usesOptions ? "Instagram, Telegram, Friend" : "Only for select types"}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Add question" : "Save changes"}
        </button>

        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-3 py-2 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
