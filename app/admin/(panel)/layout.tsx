import { LogOut } from "lucide-react";
import Link from "next/link";

import { logoutAdmin } from "@/app/admin/auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[245px_minmax(0,1fr)]">
      <aside className="bg-primary p-4 text-primary-foreground lg:sticky lg:top-0 lg:h-dvh lg:overflow-auto lg:p-5">
        <div className="mb-4 flex items-center justify-between gap-2 lg:mb-8 lg:block">
          <div>
            <p className="text-xl font-bold text-primary-foreground">Panel Admin</p>
            <Link href="/" className="text-sm font-medium text-accent underline focus-visible:outline-accent">Lihat situs PLA</Link>
          </div>
          <form action={logoutAdmin} className="lg:mt-4">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/35 px-3 text-sm font-semibold focus-visible:outline-accent">
              <LogOut aria-hidden="true" className="size-4" /> Keluar
            </button>
          </form>
        </div>
        <AdminNav />
      </aside>
      <main className="mx-auto w-full max-w-7xl min-w-0 p-4 py-8 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
