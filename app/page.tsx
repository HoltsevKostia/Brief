import { getCurrentBrief } from "@/lib/brief";
import { PublicBriefForm } from "@/components/public-brief-form";

export default async function Home() {
  const brief = await getCurrentBrief();

  if (!brief) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Бриф ще не налаштовано</h1>
          <p className="mt-2 text-sm text-slate-600">
            Будь ласка, зверніться до адміністратора для налаштування брифу.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8 border-b border-slate-100 pb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{brief.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{brief.description}</p>
        </header>
        <PublicBriefForm briefConfigId={brief.id} questions={brief.questions} />
      </section>
    </main>
  );
}
