import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { loginAdmin } from "@/app/admin/auth-actions";

export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border bg-card shadow-sm">
        <header className="bg-primary p-7 sm:p-9">
          <LockKeyhole aria-hidden="true" className="mb-5 size-7 text-accent" />
          <p className="text-sm font-bold text-accent">Prophetic Leadership Academy</p>
          <h1 className="mt-2 text-3xl text-primary-foreground">Masuk Panel Admin</h1>
        </header>
        <form action={loginAdmin} className="grid gap-4 p-7 sm:p-9">
          <label className="grid gap-2 text-sm font-bold text-primary">
            Email
            <input name="email" type="email" autoComplete="username" required className="min-h-11 rounded-lg border border-input px-3 font-normal" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-primary">
            Kata sandi
            <input name="password" type="password" autoComplete="current-password" required className="min-h-11 rounded-lg border border-input px-3 font-normal" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">
            {error === "akses" ? "Akun ini tidak memiliki akses admin." : "Email atau kata sandi tidak valid."}
          </p>}
          <button className="min-h-11 rounded-lg bg-accent px-4 font-bold text-accent-foreground">Masuk</button>
          <Link href="/" className="min-h-11 content-center text-center text-sm font-semibold text-primary underline">Kembali ke situs PLA</Link>
        </form>
      </div>
    </main>
  );
}
