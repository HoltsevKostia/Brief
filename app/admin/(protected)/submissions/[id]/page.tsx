import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

type SectionGroup = {
  id: string;
  title: string;
  sortOrder: number;
  answers: Array<{
    id: string;
    value: string;
    question: {
      label: string;
      type: string;
      sortOrder: number;
    };
  }>;
};

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
        select: {
          id: true,
          value: true,
          question: {
            select: {
              label: true,
              type: true,
              sortOrder: true,
              briefSection: {
                select: {
                  id: true,
                  title: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const sectionMap = new Map<string, SectionGroup>();

  for (const answer of submission.answers) {
    const section = answer.question.briefSection;
    const sectionId = section?.id ?? "no-section";

    if (!sectionMap.has(sectionId)) {
      sectionMap.set(sectionId, {
        id: sectionId,
        title: section?.title ?? "Без секції",
        sortOrder: section?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        answers: [],
      });
    }

    sectionMap.get(sectionId)?.answers.push({
      id: answer.id,
      value: answer.value,
      question: {
        label: answer.question.label,
        type: answer.question.type,
        sortOrder: answer.question.sortOrder,
      },
    });
  }

  const groupedSections = Array.from(sectionMap.values())
    .map((section) => ({
      ...section,
      answers: section.answers.sort((a, b) => a.question.sortOrder - b.question.sortOrder),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

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
        {groupedSections.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">Для цієї заявки немає відповідей.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSections.map((section) => (
              <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-slate-900">{section.title}</h3>

                <div className="space-y-2">
                  {section.answers.map((answer) => (
                    <div key={answer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-900">{answer.question.label}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
                        {renderAnswerValue(answer.question.type, answer.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
