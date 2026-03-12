import { AdminBriefEditor } from "@/components/admin-brief-editor";
import { getCurrentBrief } from "@/lib/brief";

export default async function AdminBriefPage() {
  const brief = await getCurrentBrief();

  if (!brief) {
    return (
      <main>
        <h1 className="text-xl font-semibold">Brief not found</h1>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit Brief</h1>
      <AdminBriefEditor brief={brief} />
    </main>
  );
}
