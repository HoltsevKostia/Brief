"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  QuestionForm,
  type AdminQuestion,
  type AdminSectionOption,
} from "@/components/question-form";
import { QuestionList } from "@/components/question-list";

type AdminSection = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  questions: AdminQuestion[];
};

type AdminBriefEditorProps = {
  brief: {
    id: string;
    title: string;
    description: string;
    sections: AdminSection[];
  };
};

export function AdminBriefEditor({ brief }: AdminBriefEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(brief.title);
  const [description, setDescription] = useState(brief.description);

  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefSuccess, setBriefSuccess] = useState<string | null>(null);
  const [isSavingBrief, setIsSavingBrief] = useState(false);

  const [sectionError, setSectionError] = useState<string | null>(null);
  const [sectionSuccess, setSectionSuccess] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<{
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  } | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [sectionSortOrder, setSectionSortOrder] = useState(brief.sections.length + 1);

  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionsSuccess, setQuestionsSuccess] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);

  const sectionFormRef = useRef<HTMLFormElement | null>(null);
  const questionFormContainerRef = useRef<HTMLDivElement | null>(null);
  const briefSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sectionsOptions = useMemo<AdminSectionOption[]>(
    () =>
      brief.sections.map((section) => ({
        id: section.id,
        title: section.title,
      })),
    [brief.sections],
  );

  useEffect(() => {
    return () => {
      if (briefSuccessTimerRef.current) clearTimeout(briefSuccessTimerRef.current);
      if (sectionSuccessTimerRef.current) clearTimeout(sectionSuccessTimerRef.current);
      if (questionsSuccessTimerRef.current) clearTimeout(questionsSuccessTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editingSection || !sectionFormRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      sectionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = sectionFormRef.current?.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select");
      firstField?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingSection]);

  useEffect(() => {
    if (!editingQuestion || !questionFormContainerRef.current) return;

    const frameId = window.requestAnimationFrame(() => {
      questionFormContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstField = questionFormContainerRef.current?.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select");
      firstField?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingQuestion]);

  function showBriefSuccess(message: string) {
    if (briefSuccessTimerRef.current) clearTimeout(briefSuccessTimerRef.current);
    setBriefSuccess(message);
    briefSuccessTimerRef.current = setTimeout(() => setBriefSuccess(null), 4000);
  }

  function showSectionSuccess(message: string) {
    if (sectionSuccessTimerRef.current) clearTimeout(sectionSuccessTimerRef.current);
    setSectionSuccess(message);
    sectionSuccessTimerRef.current = setTimeout(() => setSectionSuccess(null), 4000);
  }

  function showQuestionsSuccess(message: string) {
    if (questionsSuccessTimerRef.current) clearTimeout(questionsSuccessTimerRef.current);
    setQuestionsSuccess(message);
    questionsSuccessTimerRef.current = setTimeout(() => setQuestionsSuccess(null), 4000);
  }

  async function refreshAfterChange() {
    setEditingQuestion(null);
    setEditingSection(null);
    setSectionTitle("");
    setSectionDescription("");
    setSectionSortOrder(brief.sections.length + 1);
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

  async function submitSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSectionError(null);

    const payload = {
      title: sectionTitle.trim(),
      description: sectionDescription.trim() || null,
      sortOrder: sectionSortOrder,
    };

    const response = await fetch(
      editingSection ? `/api/admin/sections/${editingSection.id}` : "/api/admin/sections",
      {
        method: editingSection ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      setSectionError(editingSection ? "Не вдалося оновити секцію" : "Не вдалося додати секцію");
      return;
    }

    showSectionSuccess(editingSection ? "Секцію оновлено" : "Секцію додано");
    await refreshAfterChange();
  }

  async function deleteSection(sectionId: string) {
    setSectionError(null);
    const response = await fetch(`/api/admin/sections/${sectionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setSectionError(payload?.error ?? "Не вдалося видалити секцію");
      return;
    }
    showSectionSuccess("Секцію видалено");
    await refreshAfterChange();
  }

  async function moveSection(sectionId: string, direction: "up" | "down") {
    setSectionError(null);
    const response = await fetch("/api/admin/sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, direction }),
    });
    if (!response.ok) {
      setSectionError("Не вдалося змінити порядок секцій");
      return;
    }
    showSectionSuccess("Порядок секцій оновлено");
    await refreshAfterChange();
  }

  function startEditSection(section: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }) {
    setEditingSection(section);
    setSectionTitle(section.title);
    setSectionDescription(section.description ?? "");
    setSectionSortOrder(section.sortOrder);
  }

  function startEditQuestion(question: AdminQuestion) {
    setEditingQuestion(question);
  }

  function cancelSectionEdit() {
    setEditingSection(null);
    setSectionTitle("");
    setSectionDescription("");
    setSectionSortOrder(brief.sections.length + 1);
  }

  async function createQuestion(payload: {
    briefSectionId: string;
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
    briefSectionId: string;
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
      setQuestionsError("Не вдалося змінити порядок питань");
      return;
    }
    showQuestionsSuccess("Порядок питань оновлено");
    await refreshAfterChange();
  }

  return (
    <div className="space-y-6" data-testid="admin-brief-editor">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="admin-brief-settings">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Секції</h2>
        <form ref={sectionFormRef} onSubmit={submitSection} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">Назва секції</label>
              <input
                value={sectionTitle}
                onChange={(event) => setSectionTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-900">Порядок</label>
              <input
                type="number"
                min={1}
                value={sectionSortOrder}
                onChange={(event) => setSectionSortOrder(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-900">Опис секції</label>
            <textarea
              value={sectionDescription}
              onChange={(event) => setSectionDescription(event.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {sectionError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{sectionError}</p>}
          {sectionSuccess && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sectionSuccess}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              {editingSection ? "Зберегти секцію" : "Додати секцію"}
            </button>
            {editingSection ? (
              <button
                type="button"
                onClick={cancelSectionEdit}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Скасувати
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="space-y-3" data-testid="admin-questions-area">
        <h2 className="text-lg font-semibold text-slate-900">Питання</h2>
        {questionsError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{questionsError}</p>}
        {questionsSuccess && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {questionsSuccess}
          </p>
        )}

        <div ref={questionFormContainerRef}>
          <QuestionForm
            mode={editingQuestion ? "edit" : "create"}
            initial={editingQuestion ?? undefined}
            sections={sectionsOptions}
            onCancel={() => setEditingQuestion(null)}
            onSubmit={editingQuestion ? updateQuestion : createQuestion}
          />
        </div>

        <QuestionList
          sections={brief.sections}
          onEdit={startEditQuestion}
          onDelete={deleteQuestion}
          onMove={moveQuestion}
          onEditSection={startEditSection}
          onDeleteSection={deleteSection}
          onMoveSection={moveSection}
        />
      </section>
    </div>
  );
}
