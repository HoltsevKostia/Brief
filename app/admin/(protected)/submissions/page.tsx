import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Заявки</h1>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Поки що немає заявок.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700">
                <th className="px-4 py-3 font-medium">ID заявки</th>
                <th className="px-4 py-3 font-medium">Створено</th>
                <th className="px-4 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{submission.id}</td>
                  <td className="px-4 py-3 text-slate-700">{submission.createdAt.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition hover:bg-slate-100"
                    >
                      Переглянути
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
