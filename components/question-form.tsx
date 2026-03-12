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
  briefSectionId: string;
  label: string;
  type: AdminQuestionType;
  required: boolean;
  sortOrder: number;
  placeholder: string | null;
  optionsJson: unknown;
};

export type AdminSectionOption = {
  id: string;
  title: string;
};

type QuestionFormProps = {
  mode: "create" | "edit";
  initial?: AdminQuestion;
  sections: AdminSectionOption[];
  nextSortOrder?: number;
  onCancel?: () => void;
  onSubmit: (payload: {
    briefSectionId: string;
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

const QUESTION_TYPE_LABELS: Record<AdminQuestionType, string> = {
  text: "Короткий текст",
  textarea: "Текстовий блок",
  email: "Email",
  number: "Число",
  singleSelect: "Один варіант",
  multiSelect: "Кілька варіантів",
  checkbox: "Прапорець",
};

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
  sections,
  nextSortOrder = 1,
  onCancel,
  onSubmit,
}: QuestionFormProps) {
  const defaultSectionId = sections[0]?.id ?? "";

  const [briefSectionId, setBriefSectionId] = useState(initial?.briefSectionId ?? defaultSectionId);
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<AdminQuestionType>(initial?.type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? nextSortOrder);
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? "");
  const [optionsInput, setOptionsInput] = useState(optionsToInput(initial?.optionsJson));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "create") {
      setBriefSectionId(defaultSectionId);
      setLabel("");
      setType("text");
      setRequired(false);
      setSortOrder(nextSortOrder);
      setPlaceholder("");
      setOptionsInput("");
      setError(null);
      return;
    }

    if (initial) {
      setBriefSectionId(initial.briefSectionId);
      setLabel(initial.label);
      setType(initial.type);
      setRequired(initial.required);
      setSortOrder(initial.sortOrder);
      setPlaceholder(initial.placeholder ?? "");
      setOptionsInput(optionsToInput(initial.optionsJson));
      setError(null);
    }
  }, [defaultSectionId, initial, mode, nextSortOrder]);

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
        briefSectionId,
        label: label.trim(),
        type,
        required,
        sortOrder,
        placeholder: usesPlaceholder ? (placeholder.trim() || null) : null,
        optionsJson: usesOptions ? options : null,
      });

      if (mode === "create") {
        setBriefSectionId(defaultSectionId);
        setLabel("");
        setType("text");
        setRequired(false);
        setSortOrder(nextSortOrder);
        setPlaceholder("");
        setOptionsInput("");
      }
    } catch {
      setError("Не вдалося зберегти питання");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        {mode === "create" ? "Додати питання" : "Редагувати питання"}
      </h3>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900">Секція</label>
        <select
          value={briefSectionId}
          onChange={(event) => setBriefSectionId(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          required
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900">Назва питання</label>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900">Тип</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AdminQuestionType)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {QUESTION_TYPES.map((questionType) => (
              <option key={questionType} value={questionType}>
                {QUESTION_TYPE_LABELS[questionType]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900">Порядок в секції</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            min={1}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={required}
          onChange={(event) => setRequired(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Обов&apos;язкове
      </label>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900">Плейсхолдер</label>
        <input
          value={placeholder}
          onChange={(event) => setPlaceholder(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={!usesPlaceholder}
          placeholder={usesPlaceholder ? "Необов'язкова підказка" : "Не використовується для цього типу"}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900">Варіанти (через кому)</label>
        <input
          value={optionsInput}
          onChange={(event) => setOptionsInput(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={!usesOptions}
          placeholder={usesOptions ? "Варіант 1, Варіант 2" : "Тільки для select-типів"}
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {isSubmitting ? "Збереження..." : mode === "create" ? "Додати питання" : "Зберегти зміни"}
        </button>

        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            Скасувати
          </button>
        )}
      </div>
    </form>
  );
}
