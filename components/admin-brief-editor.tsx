"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionForm, type AdminQuestion } from "@/components/question-form";
import { QuestionList } from "@/components/question-list";

type AdminBriefEditorProps = {
  brief: {
    id: string;
    title: string;
    description: string;
    questions: AdminQuestion[];
  };
};

export function AdminBriefEditor({ brief }: AdminBriefEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(brief.title);
  const [description, setDescription] = useState(brief.description);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [briefSuccess, setBriefSuccess] = useState<string | null>(null);
  const [questionsSuccess, setQuestionsSuccess] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isSavingBrief, setIsSavingBrief] = useState(false);
  const briefSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nextSortOrder = useMemo(() => {
    return brief.questions.length + 1;
  }, [brief.questions]);

  useEffect(() => {
    return () => {
      if (briefSuccessTimerRef.current) clearTimeout(briefSuccessTimerRef.current);
      if (questionsSuccessTimerRef.current) clearTimeout(questionsSuccessTimerRef.current);
    };
  }, []);

  function showBriefSuccess(message: string) {
    if (briefSuccessTimerRef.current) clearTimeout(briefSuccessTimerRef.current);
    setBriefSuccess(message);
    briefSuccessTimerRef.current = setTimeout(() => setBriefSuccess(null), 4000);
  }

  function showQuestionsSuccess(message: string) {
    if (questionsSuccessTimerRef.current) clearTimeout(questionsSuccessTimerRef.current);
    setQuestionsSuccess(message);
    questionsSuccessTimerRef.current = setTimeout(() => setQuestionsSuccess(null), 4000);
  }

  async function refreshAfterChange() {
    setEditingQuestion(null);
    router.refresh();
  }

  async function saveBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingBrief(true);
    setBriefError(null);

    const response = await fetch("/api/admin/brief", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
      }),
    });

    if (!response.ok) {
      setBriefError("Не вдалося оновити бриф");
      setIsSavingBrief(false);
      return;
    }

    setIsSavingBrief(false);
    showBriefSuccess("Збережено");
    router.refresh();
  }

  async function createQuestion(payload: {
    label: string;
    type: AdminQuestion["type"];
    required: boolean;
    sortOrder: number;
    placeholder: string | null;
    optionsJson: string[] | null;
  }) {
    setQuestionsError(null);
    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setQuestionsError("Не вдалося додати питання");
      throw new Error("create-question-failed");
    }
    showQuestionsSuccess("Питання додано");
    await refreshAfterChange();
  }

  async function updateQuestion(payload: {
    label: string;
    type: AdminQuestion["type"];
    required: boolean;
    sortOrder: number;
    placeholder: string | null;
    optionsJson: string[] | null;
  }) {
    if (!editingQuestion) return;
    setQuestionsError(null);
    const response = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setQuestionsError("Не вдалося оновити питання");
      throw new Error("update-question-failed");
    }
    showQuestionsSuccess("Питання оновлено");
    await refreshAfterChange();
  }

  async function deleteQuestion(questionId: string) {
    setQuestionsError(null);
    const response = await fetch(`/api/admin/questions/${questionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setQuestionsError("Не вдалося видалити питання");
      return;
    }
    showQuestionsSuccess("Питання видалено");
    await refreshAfterChange();
  }

  async function moveQuestion(questionId: string, direction: "up" | "down") {
    setQuestionsError(null);
    const response = await fetch("/api/admin/questions/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, direction }),
    });
    if (!response.ok) {
      setQuestionsError("Не вдалося змінити порядок");
      return;
    }
    showQuestionsSuccess("Порядок оновлено");
    await refreshAfterChange();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Налаштування брифу</h2>
        <form onSubmit={saveBrief} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900">Заголовок</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900">Опис</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {briefError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{briefError}</p>}
          {briefSuccess && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{briefSuccess}</p>
          )}

          <button
            type="submit"
            disabled={isSavingBrief}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSavingBrief ? "Збереження..." : "Зберегти бриф"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Питання</h2>
        {questionsError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{questionsError}</p>}
        {questionsSuccess && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {questionsSuccess}
          </p>
        )}

        {editingQuestion ? (
          <QuestionForm
            mode="edit"
            initial={editingQuestion}
            onCancel={() => setEditingQuestion(null)}
            onSubmit={updateQuestion}
          />
        ) : (
          <QuestionForm mode="create" nextSortOrder={nextSortOrder} onSubmit={createQuestion} />
        )}

        <QuestionList
          questions={brief.questions}
          onEdit={setEditingQuestion}
          onDelete={deleteQuestion}
          onMove={moveQuestion}
        />
      </section>
    </div>
  );
}
