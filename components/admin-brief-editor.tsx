"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [isSavingBrief, setIsSavingBrief] = useState(false);

  const nextSortOrder = useMemo(() => {
    return brief.questions.length + 1;
  }, [brief.questions]);

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
      setBriefError("Failed to update brief");
      setIsSavingBrief(false);
      return;
    }

    setIsSavingBrief(false);
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
      setQuestionsError("Failed to create question");
      throw new Error("create-question-failed");
    }
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
      setQuestionsError("Failed to update question");
      throw new Error("update-question-failed");
    }
    await refreshAfterChange();
  }

  async function deleteQuestion(questionId: string) {
    setQuestionsError(null);
    const response = await fetch(`/api/admin/questions/${questionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setQuestionsError("Failed to delete question");
      return;
    }
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
      setQuestionsError("Failed to reorder question");
      return;
    }
    await refreshAfterChange();
  }

  return (
    <div className="space-y-6">
      <section className="rounded border p-4">
        <h2 className="mb-3 text-lg font-semibold">Brief config</h2>
        <form onSubmit={saveBrief} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {briefError && <p className="text-sm text-red-600">{briefError}</p>}

          <button
            type="submit"
            disabled={isSavingBrief}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isSavingBrief ? "Saving..." : "Save brief"}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Questions</h2>
        {questionsError && <p className="text-sm text-red-600">{questionsError}</p>}

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
