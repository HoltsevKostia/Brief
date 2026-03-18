import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function renderAnswerValue(type: string, rawValue: string): string {
  if (type === "checkbox") {
    return rawValue === "true" ? "Так" : "Ні";
  }

  if (type === "multiSelect") {
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed.join(", ");
      }
    } catch {
      return rawValue;
    }
    return rawValue;
  }

  return rawValue;
}

export default async function AdminSubmissionDetailPage({ params }: Params) {
  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      answers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          value: true,
          question: {
            select: {
              label: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Деталі заявки</h1>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <p>
          <span className="font-medium text-slate-900">ID:</span>{" "}
          <span className="font-mono text-xs text-slate-700">{submission.id}</span>
        </p>
        <p className="mt-1 text-slate-700">
          <span className="font-medium text-slate-900">Створено:</span>{" "}
          {submission.createdAt.toLocaleString()}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Відповіді</h2>
        {submission.answers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Для цієї заявки немає відповідей.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submission.answers.map((answer) => (
              <div key={answer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-900">{answer.question.label}</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {renderAnswerValue(answer.question.type, answer.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
