import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between border-b pb-3">
        <nav className="flex items-center gap-4">
          <Link href="/admin/brief" className="text-sm font-medium">
            Brief
          </Link>
          <Link href="/admin/submissions" className="text-sm font-medium">
            Submissions
          </Link>
        </nav>
        <AdminLogoutButton />
      </header>
      {children}
    </div>
  );
}
