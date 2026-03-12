import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

function renderAnswerValue(type: string, rawValue: string): string {
  if (type === "checkbox") {
    return rawValue === "true" ? "Yes" : "No";
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
      <h1 className="text-2xl font-semibold">Submission Details</h1>

      <div className="rounded border p-4 text-sm">
        <p>
          <span className="font-medium">ID:</span> <span className="font-mono">{submission.id}</span>
        </p>
        <p>
          <span className="font-medium">Created At:</span> {submission.createdAt.toLocaleString()}
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Answers</h2>
        {submission.answers.length === 0 ? (
          <p className="text-sm text-gray-600">No answers for this submission.</p>
        ) : (
          <div className="space-y-2">
            {submission.answers.map((answer) => (
              <div key={answer.id} className="rounded border p-3">
                <p className="text-sm font-medium">{answer.question.label}</p>
                <p className="text-sm text-gray-700">
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
