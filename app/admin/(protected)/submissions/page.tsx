import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Submissions</h1>

      {submissions.length === 0 ? (
        <p className="text-sm text-gray-600">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2 font-medium">Submission ID</th>
                <th className="px-3 py-2 font-medium">Created At</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono text-xs">{submission.id}</td>
                  <td className="px-3 py-2">{submission.createdAt.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      View
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
