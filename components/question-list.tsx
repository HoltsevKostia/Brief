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

export function QuestionList({ questions, onEdit, onDelete, onMove }: QuestionListProps) {
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div key={question.id} className="rounded border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium">{question.label}</p>
              <p className="text-xs text-gray-600">
                type: {question.type} | required: {question.required ? "yes" : "no"} | sortOrder:{" "}
                {question.sortOrder}
              </p>
              {question.placeholder && (
                <p className="text-xs text-gray-600">placeholder: {question.placeholder}</p>
              )}
              {(question.type === "singleSelect" || question.type === "multiSelect") && (
                <p className="text-xs text-gray-600">
                  options: {formatOptions(question.optionsJson)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onMove(question.id, "up")}
                disabled={index === 0}
                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => onMove(question.id, "down")}
                disabled={index === questions.length - 1}
                className="rounded border px-2 py-1 text-xs disabled:opacity-50"
              >
                Down
              </button>
              <button
                type="button"
                onClick={() => onEdit(question)}
                className="rounded border px-2 py-1 text-xs"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(question.id)}
                className="rounded border px-2 py-1 text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
