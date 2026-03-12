import { AdminBriefEditor } from "@/components/admin-brief-editor";
import { getCurrentBrief } from "@/lib/brief";

export default async function AdminBriefPage() {
  const brief = await getCurrentBrief();

  if (!brief) {
    return (
      <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Бриф не знайдено</h1>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Редагування брифу</h1>
      <AdminBriefEditor brief={brief} />
    </main>
  );
}
