"use client";

import type { AdminQuestion } from "@/components/question-form";

type AdminSectionWithQuestions = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  questions: AdminQuestion[];
};

type QuestionListProps = {
  sections: AdminSectionWithQuestions[];
  onEdit: (question: AdminQuestion) => void;
  onDelete: (questionId: string) => Promise<void>;
  onMove: (questionId: string, direction: "up" | "down") => Promise<void>;
  onEditSection: (section: { id: string; title: string; description: string | null; sortOrder: number }) => void;
  onDeleteSection: (sectionId: string) => Promise<void>;
  onMoveSection: (sectionId: string, direction: "up" | "down") => Promise<void>;
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

export function QuestionList({
  sections,
  onEdit,
  onDelete,
  onMove,
  onEditSection,
  onDeleteSection,
  onMoveSection,
}: QuestionListProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => (
        <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-base font-semibold text-slate-900">{section.title}</p>
              {section.description ? (
                <p className="mt-1 text-xs text-slate-600">{section.description}</p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">Порядок секції: {section.sortOrder}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onMoveSection(section.id, "up")}
                disabled={sectionIndex === 0}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Секція вгору
              </button>
              <button
                type="button"
                onClick={() => onMoveSection(section.id, "down")}
                disabled={sectionIndex === sections.length - 1}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Секція вниз
              </button>
              <button
                type="button"
                onClick={() =>
                  onEditSection({
                    id: section.id,
                    title: section.title,
                    description: section.description,
                    sortOrder: section.sortOrder,
                  })
                }
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
              >
                Редагувати секцію
              </button>
              <button
                type="button"
                onClick={() => onDeleteSection(section.id)}
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-700 transition hover:bg-red-100"
              >
                Видалити секцію
              </button>
            </div>
          </div>

          {section.questions.length === 0 ? (
            <p className="text-sm text-slate-600">У цій секції ще немає питань.</p>
          ) : (
            <div className="space-y-3">
              {section.questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{question.label}</p>
                      <p className="text-xs text-slate-600">
                        тип: {QUESTION_TYPE_LABELS[question.type]} | обов&apos;язкове:{" "}
                        {question.required ? "так" : "ні"} | порядок: {question.sortOrder}
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
                        disabled={index === section.questions.length - 1}
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
          )}
        </section>
      ))}
    </div>
  );
}
