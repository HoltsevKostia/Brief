import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { AdminLogoutButton } from "@/components/admin-logout-button";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdminPage();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <nav className="flex items-center gap-2">
            <Link
              href="/admin/brief"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Бриф
            </Link>
            <Link
              href="/admin/submissions"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Заявки
            </Link>
          </nav>
          <AdminLogoutButton />
        </header>
        {children}
      </div>
    </div>
  );
}