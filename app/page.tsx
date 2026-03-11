import { getCurrentBrief } from "@/lib/brief";
import { PublicBriefForm } from "@/components/public-brief-form";

export default async function Home() {
  const brief = await getCurrentBrief();

  if (!brief) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Brief is not configured</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">{brief.title}</h1>
      <p className="mb-6 text-sm text-gray-600">{brief.description}</p>
      <PublicBriefForm briefConfigId={brief.id} questions={brief.questions} />
    </main>
  );
}
