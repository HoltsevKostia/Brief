import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSessionFromCookies } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getAdminSessionFromCookies();
  if (session) {
    redirect("/admin/brief");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">Вхід адміністратора</h1>
        <p className="mb-6 text-sm text-slate-600">Увійдіть, щоб керувати брифом і заявками.</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
