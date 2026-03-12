"use client";

import type { AdminQuestion } from "@/components/question-form";

type QuestionListProps = {
  questions: AdminQuestion[];
  onEdit: (question: AdminQuestion) => void;
  onDelete: (questionId: string) => Promise<void>;
  onMove: (questionId: string, direction: "up" | "down") => Promise<void>;
};

function formatOptions(optionsJson: unknown) {
  if (!Array.isArray(optionsJson)) return "";
  const options = optionsJson.filter((item): item is string => typeof item === "string");
  return options.join(", ");
}

const QUESTION_TYPE_LABELS: Record<AdminQuestion["type"], string> = {
  text: "Короткий текст",
  textarea: "Текстовий блок",
  email: "Email",
  number: "Число",
  singleSelect: "Один варіант",
  multiSelect: "Кілька варіантів",
  checkbox: "Прапорець",
};

export function QuestionList({ questions, onEdit, onDelete, onMove }: QuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-medium text-slate-900">{question.label}</p>
              <p className="text-xs text-slate-600">
                тип: {QUESTION_TYPE_LABELS[question.type]} | обов&apos;язкове:{" "}
                {question.required ? "так" : "ні"} | порядок:{" "}
                {question.sortOrder}
              </p>
              {question.placeholder && (
                <p className="text-xs text-slate-600">плейсхолдер: {question.placeholder}</p>
              )}
              {(question.type === "singleSelect" || question.type === "multiSelect") && (
                <p className="text-xs text-slate-600">
                  варіанти: {formatOptions(question.optionsJson)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onMove(question.id, "up")}
                disabled={index === 0}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Вгору
              </button>
              <button
                type="button"
                onClick={() => onMove(question.id, "down")}
                disabled={index === questions.length - 1}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Вниз
              </button>
              <button
                type="button"
                onClick={() => onEdit(question)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
              >
                Редагувати
              </button>
              <button
                type="button"
                onClick={() => onDelete(question.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 transition hover:bg-red-100"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
